const configurationService = require('../services/configurationService');

/// Middleware to check and manage tokens
const verifyApiConfiguration = async (req, user) => {
    //console.log('verifyApiConfiguration', user)
    try {
        //let apiConfiguration = await configurationService.getConfigurationByObject({ type: req.body.type });
        let apiConfiguration = await configurationService.getConfigurationByObject({ _id: user.configration_id, type: req.body.type });

        if (!apiConfiguration || (await isTokenExpired(apiConfiguration))) {
            console.log('I am ready to create or update token object');
            apiConfiguration = await configurationService.createOrUpdateConfiguration(req, user);
        }

        return apiConfiguration;
    } catch (error) {
        throw new Error(error.message);
    }
};


const isTokenExpired = async (apiConfiguraion) => {
    const nowInSeconds = Math.floor(Date.now() / 1000);
    const expireTimeInSeconds = new Date(apiConfiguraion.created_at).getTime() / 1000 + apiConfiguraion.expires_in;
    // console.log('nowInSeconds',nowInSeconds ,'expireTimeInSeconds',expireTimeInSeconds);
    return Boolean(nowInSeconds > expireTimeInSeconds);
};

module.exports = verifyApiConfiguration;