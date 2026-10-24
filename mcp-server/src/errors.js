/** 统一的结构化错误构造：所有跨 HTTP 边界抛出的错误都带 code，便于 web 端翻译 */

export function appError(message, code) {
  const err = new Error(message);
  err.code = code;
  return err;
}
