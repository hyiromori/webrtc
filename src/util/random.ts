const UrlSafeCharacters =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz01234567890";

/**
 * URL Safe な乱数を生成する
 *
 * @param size string 乱数の文字数
 * @return string 乱数
 */
export const generateRandomUrlSafeText = (size: number): string =>
  Array.from({ length: size })
    .map(() =>
      UrlSafeCharacters.charAt(
        Math.floor(Math.random() * UrlSafeCharacters.length)
      )
    )
    .join("");
