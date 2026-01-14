export const getMongoConnectionString = (): string => {
  // If a full connection string is provided, use it directly
  if (process.env.MONGODB_URI) {
    return process.env.MONGODB_URI;
  }

  // Otherwise, build from components
  const username = process.env.DB_USERNAME || 'mzohaib0677';
  const password = process.env.DB_PASSWORD || 'zohaib1071';
  const cluster = process.env.DB_CLUSTER || 'cluster0.0hgzd.mongodb.net';
  const database = process.env.DB_NAME || 'nestjs_backend';

  return `mongodb+srv://${username}:${password}@${cluster}/${database}?retryWrites=true&w=majority`;
};

