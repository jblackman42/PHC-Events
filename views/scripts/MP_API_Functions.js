const getUser = async () => {
  const userData = await axios({
      method: 'get',
      url: '/api/oauth/user'
  })
      .then(response => response.data)

  return userData;
}

const getClientAccessToken = async () => {
  const tokenData = await axios({
      method: 'get',
      url: '/api/oauth/client-authorize'
  })
      .then(response => response.data)

  return tokenData;
}

const getEvents = async () => {

}