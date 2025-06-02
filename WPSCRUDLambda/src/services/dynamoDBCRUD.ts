const AWS = require('aws-sdk');
// Region should be set in Lambda config or via AWS_REGION env var
const ddb = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.QUERIES_TABLE; // e.g. "WallapopQueries"

// 1) CREATE a new watch/query
async function createQuery({ userId, queryKey, params, chatId }) {
  const item = {
    PK:          `USER#${userId}`,
    SK:          `QUERY#${queryKey}`,
    params,                  // Map of your query parameters
    chatId,                  // Telegram chat to notify
    lastOfferId: null,       // initialize as null
    createdAt: new Date().toISOString()
  };

  await ddb.put({
    TableName: TABLE_NAME,
    Item:      item
  }).promise();

  return item;
}

// 2) READ all queries for a given user
async function getQueriesByUser(userId) {
  const { Items } = await ddb.query({
    TableName:              TABLE_NAME,
    KeyConditionExpression: 'PK = :pk',
    ExpressionAttributeValues: {
      ':pk': `USER#${userId}`
    }
  }).promise();

  return Items;
}

// 3) UPDATE the lastOfferId (or any other field)
async function updateLastOffer({ userId, queryKey, newOfferId }) {
  const params = {
    TableName: TABLE_NAME,
    Key: {
      PK: `USER#${userId}`,
      SK: `QUERY#${queryKey}`
    },
    UpdateExpression:    'SET lastOfferId = :o, updatedAt = :u',
    ExpressionAttributeValues: {
      ':o': newOfferId,
      ':u': new Date().toISOString()
    },
    ReturnValues: 'UPDATED_NEW'
  };

  const result = await ddb.update(params).promise();
  return result.Attributes;
}

// 4) DELETE a watch/query
async function deleteQuery({ userId, queryKey }) {
  await ddb.delete({
    TableName: TABLE_NAME,
    Key: {
      PK: `USER#${userId}`,
      SK: `QUERY#${queryKey}`
    }
  }).promise();

  return { deleted: true };
}




