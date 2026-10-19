import { Config, get, GetFunc } from "./index";
import { sha256ToHex } from "./sha256";

export interface IUploadConfig extends Config<string> {
  getFunc?: GetFunc;
  /**
   * @default <code>true</code>
   */
  addDigestHeader?: boolean;
}

export const XFileDigestHeader = "X-File-Digest";

export async function upload(
  url: string,
  file: string | Blob | BufferSource, // Exclude<IUploadConfig["body"], undefined | null>,
  { addDigestHeader = true, getFunc = get, ...propsConfig }: IUploadConfig = {},
): Promise<string> {
  const config: Config<string> = {
    ...propsConfig,
    method: "POST",
    body: file,
  };

  if (addDigestHeader) {
    const hash = await sha256ToHex(file);
    config.headers = {
      ...config.headers,
      [XFileDigestHeader]: hash,
    };
  }

  return getFunc<string>(url, config);
}
