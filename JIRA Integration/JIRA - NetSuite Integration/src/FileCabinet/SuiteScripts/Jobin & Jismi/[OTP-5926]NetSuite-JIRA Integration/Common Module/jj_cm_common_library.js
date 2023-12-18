/**
 * @NApiVersion 2.1
 */
define(['N/https', 'N/record', 'N/search', 'N/log', 'N/config','N/encode'],
(https, record, search, log, config, encode) => {

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
    
    function extractStringFromURL(jiraTaskUrl) {
        // Split the URL at '?selectedIssue='
        let parts = jiraTaskUrl.split('?selectedIssue=');
    
        // Return the part after '?selectedIssue='
        // If the URL doesn't contain '?selectedIssue=', return an empty string
        let splitString = parts.length > 1 ? parts[1] : '';
        return splitString;
    }

    function jiraApiRequest(username,apiToken, domainUrl, issueKey) {
        let encodedCredentials = encode.convert({
            string: username + ':' + apiToken,
            inputEncoding: encode.Encoding.UTF_8,
            outputEncoding: encode.Encoding.BASE_64
        });
       
        let headers = {
            "Authorization": "Basic " + encodedCredentials,
            "Content-Type": "application/json",
            "Accept":"*/*",
            "Accept-Encoding":"gzip, deflate, br"
        };

        let response = https.get({
            url: domainUrl + "/rest/api/3/issue/picker?currentIssueKey=" + issueKey,
            headers: headers
        });
        log.debug("response",response);

        // Handle the response
        if (response.code === 200) {
            let responseBody = JSON.parse(response.body);
            var issues = responseBody.sections[0].issues.map(issue => {
                return {
                    id: issue.id,
                    key: issue.key,
                    summary: issue.summary
                };
            });
            log.debug("issues",issues);
            return responseBody;
        } else {
            log.error('JIRA API Error', response);
            return log;
        }
    }
   

    return {
        getJiraApiInfo: getJiraApiInfo,
        isProduction: configFunction.isProduction,
        extractStringFromURL: extractStringFromURL,
        jiraApiRequest: jiraApiRequest    
    }


    
});
