export const ENV = {
  appId: process.env.VITE_APP_ID ?? "catalogo-cursos",
  cookieSecret: process.env.JWT_SECRET ?? "catalogo-cursos-secret-key-32chars-min!",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "admin",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  // Storage settings (defaults to local disk storage if S3/Forge are not configured)
  storageDriver: process.env.STORAGE_DRIVER ?? (process.env.S3_BUCKET ? "s3" : process.env.BUILT_IN_FORGE_API_URL ? "forge" : "local"),
  storageDir: process.env.STORAGE_DIR ?? "storage_data",
  s3Bucket: process.env.S3_BUCKET ?? process.env.STORAGE_BUCKET ?? "",
  s3Endpoint: process.env.S3_ENDPOINT ?? "",
  s3Region: process.env.S3_REGION ?? "auto",
  s3AccessKeyId: process.env.S3_ACCESS_KEY_ID ?? process.env.AWS_ACCESS_KEY_ID ?? "",
  s3SecretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? process.env.AWS_SECRET_ACCESS_KEY ?? "",
  s3PublicUrl: process.env.S3_PUBLIC_URL ?? "",
};

