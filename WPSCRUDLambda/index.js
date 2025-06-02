// Example Lambda handler routing on HTTP method
export async function handler(event) {
  const userId   = event.requestContext.authorizer.principalId; // or from payload
  const queryKey = event.pathParameters.queryKey;               // e.g. "/queries/{queryKey}"
  const body     = event.body ? JSON.parse(event.body) : {};

  try {
    let response;
    switch (event.httpMethod) {
      case 'POST':
        // body: { queryKey, params, chatId }
        response = await createQuery({ userId, ...body });
        break;
      case 'GET':
        response = await getQueriesByUser(userId);
        break;
      case 'PUT':
        // body: { newOfferId }
        response = await updateLastOffer({ userId, queryKey, newOfferId: body.newOfferId });
        break;
      case 'DELETE':
        response = await deleteQuery({ userId, queryKey });
        break;
      default:
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(response)
    };

  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
