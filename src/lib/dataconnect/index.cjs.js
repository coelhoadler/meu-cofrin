const { queryRef, executeQuery, validateArgsWithOptions, mutationRef, executeMutation, validateArgs } = require('firebase/data-connect');

const connectorConfig = {
  connector: 'default',
  service: 'meu-cofrin-b2b',
  location: 'us-central1'
};
exports.connectorConfig = connectorConfig;

const createCompanyProfileRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateCompanyProfile', inputVars);
}
createCompanyProfileRef.operationName = 'CreateCompanyProfile';
exports.createCompanyProfileRef = createCompanyProfileRef;

exports.createCompanyProfile = function createCompanyProfile(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(createCompanyProfileRef(dcInstance, inputVars));
}
;

const getCompanyProfileRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetCompanyProfile');
}
getCompanyProfileRef.operationName = 'GetCompanyProfile';
exports.getCompanyProfileRef = getCompanyProfileRef;

exports.getCompanyProfile = function getCompanyProfile(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(getCompanyProfileRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;
