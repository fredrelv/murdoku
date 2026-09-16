export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export const Unauthorized = () => new ApiError(401, "Autenticação necessária.");
export const Forbidden = (msg = "Sem permissão para esta ação.") => new ApiError(403, msg);
export const NotFound = (msg = "Não encontrado.") => new ApiError(404, msg);
export const BadRequest = (msg: string) => new ApiError(400, msg);
export const Conflict = (msg: string) => new ApiError(409, msg);
export const TooManyRequests = (msg = "Demasiadas tentativas. Tente novamente mais tarde.") =>
  new ApiError(429, msg);
