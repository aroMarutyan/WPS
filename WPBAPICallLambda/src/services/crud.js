import { DynamoDBClient, ScanCommand, PutItemCommand, UpdateItemCommand, DeleteItemCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall, marshall } from '@aws-sdk/util-dynamodb';

const DDB = new DynamoDBClient({region: 'eu-west-1'});
const TABLE_NAME = process.env.TABLE_NAME;

export async function getSearches() {
  try {
    const data = await DDB.send(new ScanCommand({ TableName: TABLE_NAME, ConsistentRead: true }));
    const rempappedData = data.Items.map(search => unmarshall(search));

    return rempappedData;
  } catch(e) {
    console.log('Could not get searches', e);
  }
}

export async function updateSearchData(searchId, newestResult) {
  await updateSearchStringKey(searchId, 'latestOfferId', newestResult.id);
  await updateSearchStringKey(searchId, 'lastModified', String(newestResult.modified_at));
}

async function updateSearchStringKey(searchId, key, value) {
  try {
    const searchToEdit = {
      TableName: TABLE_NAME,
      Key: marshall({ searchId: searchId }),
      ExpressionAttributeNames: { '#KEY': `${key}` },
      ExpressionAttributeValues: marshall({ ':VAL': value }),
      ReturnValues: 'ALL_NEW',
      UpdateExpression: 'SET #KEY = :VAL'
    };

    await DDB.send(new UpdateItemCommand(searchToEdit));
  } catch(e) {
    console.log('Error updating search', e);
  }
}

