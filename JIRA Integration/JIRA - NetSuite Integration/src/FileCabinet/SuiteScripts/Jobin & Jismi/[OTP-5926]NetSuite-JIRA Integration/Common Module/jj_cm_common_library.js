/**
 * @NApiVersion 2.1
 */
define(['N/http', 'N/record', 'N/search', 'N/log', 'N/config'],
(http, record, search, log, config) => {

    const configFunction = {
        isProduction() {
            try {
                let companyInfo = config.load({
                    type: config.Type.COMPANY_INFORMATION
                });
                let ns_companyid = companyInfo.getValue({
                    fieldId: 'companyid'
                }).toString().trim().toLowerCase();

                if (Number.isNaN(Number(ns_companyid))) {
                    return false;
                }
                return true;
            } catch (e) {
                log.error('error @ isProduction', e);
                return false;
            }
        }
    };

    function getJiraApiInfo() {
        let customRecordSearch = search.create({
            type: "customrecord_jj_jira_api_info",
            filters:[
                ["internalid","anyof","1"]
            ],
            columns: [
                
                search.createColumn({ name: "custrecord_jj_api_token" }),
                search.createColumn({ name: "custrecord_jj_domain_url" }),
                search.createColumn({ name: "custrecord_jj_jira_task_url" })
            ]
        });

        let searchResults = [];
        customRecordSearch.run().each(function(result){
            let jiraTaskUrl = result.getValue({ name: "custrecord_jj_jira_task_url" });
            // let queryParamsString = jiraTaskUrl.split('?')[1];
            // let queryParams = queryParamsString.split('&');
            // let selectedIssue = queryParams.reduce((issue, param) => {
            //     let [key, value] = param.split('=');
            //     if (key === 'selectedIssue') {
            //         return value;
            //     }
            //     return issue;
            // }, '');
            // log.debug("issue",issue);
    
            searchResults.push({
                apiToken: result.getValue({ name: "custrecord_jj_api_token" }),
                domainUrl: result.getValue({ name: "custrecord_jj_domain_url" }),
                jiraTaskUrl: jiraTaskUrl
                //selectedIssue: selectedIssue // Added selectedIssue to the result
            });
            return true;
        });

        return searchResults; 
    }

    return {
        getJiraApiInfo: getJiraApiInfo,
        isProduction: configFunction.isProduction
    }


    
});
