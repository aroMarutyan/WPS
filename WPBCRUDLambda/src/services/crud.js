import { DynamoDBClient, ScanCommand, PutItemCommand, UpdateItemCommand, DeleteItemCommand, GetItemCommand } from "@aws-sdk/client-dynamodb";
import { unmarshall, marshall } from '@aws-sdk/util-dynamodb';

import { botResponse, botResponseHTML } from './telegram-bot.js';
import { formatConditions, formatSearchToHTML } from './format.js';

const DDB = new DynamoDBClient({region: 'eu-west-1'});
const TABLE_NAME = process.env.TABLE_NAME;

export async function listSearches(text) {
  try {
    const data = await DDB.send(new ScanCommand({ TableName: TABLE_NAME }));
    const unmarshalledSearches = data.Items.map(search => unmarshall(search));
    const searchesToShow = text.includes('activeOnly') 
      ? unmarshalledSearches.filter(search => search.active) 
      : unmarshalledSearches; 

    for await (const search of searchesToShow) {
      await botResponseHTML(formatSearchToHTML(search));
    }
  } catch(e) {
    console.log('Error getting the list ofsearches', e);
    await botResponse('Error getting the list ofsearches');
  }
}

export async function createNewSearch(text) {
  try {
    const searchData = text.split('\n');
    const searchId = getIdNum();
    const searchToAdd = {
      TableName: TABLE_NAME,
      Item: marshall({
        alias: searchData[1],
        searchTerm: searchData[2],
        minSalePrice: searchData[3] ?? '',
        maxSalePrice: searchData[4] ?? '',
        condition: formatConditions(searchData[5]),
        active: true,
        searchId,
      })
    }

    await DDB.send(new PutItemCommand(searchToAdd));
    await botResponse('Search successfully added');
    await getSearch(searchId);
  } catch(e) {
    console.log('Error adding new search', e);
    await botResponse('Error adding new search');
  }
}

export async function updateSearch(text) {
  try {
    const params = text.split('\n');
    const key = params[2];
    const newValue = handleNewValue(key, params[3]);
    const searchToEdit = {
      ...getSearchParams(params[1]),
      ExpressionAttributeNames: {'#KEY': params[2]},
      ExpressionAttributeValues: marshall({':VAL': newValue}),
      ReturnValues: 'ALL_NEW',
      UpdateExpression: 'SET #KEY = :VAL'
    };

    await DDB.send(new UpdateItemCommand(searchToEdit));
    await botResponse(`search successfully updated`);
    await getSearch(params[1]);
  } catch(e) {
    console.log('Error updating search', e);
    await botResponse('Error updating search');
  }
}

export async function deleteSearch(text) {
  try {
    const searchId = text.split('\n')[1];

    await DDB.send(new DeleteItemCommand(getSearchParams(searchId)));
    await botResponse('Search successfully deleted');
  } catch(e) {
    console.log('Error deleting search', e);
    await botResponse('Error deleting search');
  }
}

async function getSearch(searchId) {
  try {
    const search = await DDB.send(new GetItemCommand(getSearchParams(searchId)));

    await botResponseHTML(formatSearchToHTML(unmarshall(search.Item)));
  } catch(e) {
    console.log('Error fetching search', e);
    await botResponse('Error fetching search');
  }
}

function getSearchParams(searchId) {
  return {
    TableName: TABLE_NAME,
    Key: marshall({ searchId: searchId })
  }
}

function handleNewValue(key, value) {
  switch(true) {
    case (!value):
      return '';

    case (key === 'active'):
      return (value === 'yes') || (value === '1') || (value === 'true') ? true : false;

    case (key === 'condition'):
      return formatConditions(value);

    default:
    return value;
  }
}

function getIdNum() {
  return `${Math.floor(Math.random() * 1000000)}`;
}