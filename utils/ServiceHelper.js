const dataServer = require("../configs/dataServer");

const getServer = (name) => {
    return dataServer[name];
};

const getApi = (serverName, apiName) => {
    const server = getServer(serverName);
    const apiCall = server.api[apiName];
    return {method: apiCall.method, url: `${server.serviceEndPoint}${apiCall.url}` };
};

module.exports = {
    getServer: getServer,
    getApi: getApi
};