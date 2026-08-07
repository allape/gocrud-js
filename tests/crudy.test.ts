import { describe, expect, test } from "@jest/globals";
import Crudy, {
  BaseSearchParams,
  IBase,
  IBaseSearchParams,
  M2MConnectorHandler,
} from "../";

interface IUser extends IBase {
  name: string;
  age: number;
}

interface IUserSearchParams extends IBaseSearchParams {
  like_name?: string;
  name?: string;
}

interface ITag extends IBase {
  name: string;
}

interface ITagSearchParams extends IBaseSearchParams {
  like_name?: string;
  name?: string;
}

interface IUserTag extends Pick<IBase, "createdAt"> {
  userId: IUser["id"];
  tagId: ITag["id"];
}

global.confirm = function confirm(msg?: string) {
  console.error(msg);
  return false;
};

describe("test crudy", () => {
  const crudy = new Crudy<IUser, IUserSearchParams>(
    "http://localhost:8080/user",
  );
  test("user crudy", async () => {
    await new Promise((r) => setTimeout(r, 1000));

    const u1 = await crudy.save({
      name: "user1",
    });
    expect(u1.id).toBe(1);
    expect(u1.name).toBe("user1");

    const u2 = await crudy.save({
      name: "user2",
    });
    expect(u2.id).toBe(2);
    expect(u2.name).toBe("user2");
    expect(u2.deletedAt).toBe(null);

    const all = await crudy.all();
    expect(all.length).toBe(2);

    const all1 = await crudy.all({
      like_name: undefined,
    });
    expect(all1.length).toBe(2);

    const all2 = await crudy.all({
      like_name: null as unknown as string,
    });
    expect(all2.length).toBe(2);

    const all3 = await crudy.all({
      like_name: Number.NaN as unknown as string,
    });
    expect(all3.length).toBe(2);

    const all4 = await crudy.all({
      in_id: [1,2],
    });
    expect(all4.length).toBe(2);

    const all5 = await crudy.all({
      in_id: [2],
    });
    expect(all5.length).toBe(1);
    expect(all5[0].id).toBe(2);

    const all6 = await crudy.all({
      like_name: "2",
    });
    expect(all6.length).toBe(1);

    const page = await crudy.page(1, 1);
    expect(page.length).toBe(1);
    expect(page[0].id).toBe(1);

    const deleted = await crudy.delete(1);
    expect(deleted).toBe(true);

    const deletedAgain = await crudy.delete(1);
    expect(deletedAgain).toBe(true);

    const count = await crudy.count(BaseSearchParams);
    expect(count).toBe(1);

    const one = await crudy.one(2);
    expect(one.id).toBe(2);
    expect(one.name).toBe("user2");
  });
});

describe("test m2m connector handler", (): void => {
  const userCrudy = new Crudy<IUser, IUserSearchParams>(
    "http://localhost:8080/user",
  );
  const tagCrudy = new Crudy<ITag, ITagSearchParams>(
    "http://localhost:8080/tag",
  );

  const userTagConnectorHandler = new M2MConnectorHandler<
    IUser,
    ITag,
    IUserTag
  >("http://localhost:8080/user-tag", userCrudy, tagCrudy, "userId", "tagId");

  test("m2m connector handler", async () => {
    await userCrudy.save({
      id: 1,
      name: "user1",
    });
    await userCrudy.save({
      id: 2,
      name: "user2",
    });

    await tagCrudy.save({
      id: 1,
      name: "tag1",
    });
    await tagCrudy.save({
      id: 2,
      name: "tag2",
    });
    await tagCrudy.save({
      id: 3,
      name: "tag3",
    });
    await tagCrudy.save({
      id: 4,
      name: "tag4",
    });
    await tagCrudy.save({
      id: 5,
      name: "tag5",
    });

    const count1 = await userTagConnectorHandler.saveAfterDelete("userId", 1, [
      {
        userId: 1,
        tagId: 1,
      },
      {
        userId: 1,
        tagId: 2,
      },
      {
        userId: 1,
        tagId: 3,
      },
    ]);
    expect(count1).toBe(3);

    const count2 = await userTagConnectorHandler.saveAfterDelete("userId", 2, [
      {
        userId: 2,
        tagId: 3,
      },
      {
        userId: 2,
        tagId: 4,
      },
      {
        userId: 2,
        tagId: 5,
      },
    ]);
    expect(count2).toBe(3);

    const user1Tags = await userTagConnectorHandler.getAll("userId", [1]);
    console.log(user1Tags);
    expect(user1Tags.length).toBe(3);

    const tag3Users = await userTagConnectorHandler.get<IUser>("tagId", [3]);
    console.log(tag3Users);
    expect(Object.keys(tag3Users).length).toBe(1);
    expect(tag3Users[3].length).toBe(2);

    const users = await userTagConnectorHandler.get<ITag>("userId", [1]);
    expect(Object.keys(users).length).toBe(1);
    expect(users[1].length).toBe(3);

    const tags = await userTagConnectorHandler.get<ITag>("userId", [1, 2]);
    expect(Object.keys(tags).length).toBe(2);
    expect(tags[1].length).toBe(3);
    expect(tags[2].length).toBe(3);

    const count3 = await userTagConnectorHandler.delete(1, 1);
    expect(count3).toBe(1);

    const allUserTags = await userTagConnectorHandler.getAll("userId", [1, 2]);
    expect(allUserTags.length).toBe(5);
  });
});
