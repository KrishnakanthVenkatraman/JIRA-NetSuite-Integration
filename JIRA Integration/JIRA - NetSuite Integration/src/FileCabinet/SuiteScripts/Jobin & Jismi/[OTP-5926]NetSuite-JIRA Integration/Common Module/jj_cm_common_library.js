/**
 * @NApiVersion 2.1
 */
define(['N/https', 'N/record', 'N/search', 'N/log', 'N/config', 'N/encode'],
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

        /**
         * This function is used to create a custom saved search for getting the JIRA details from custom record
         * @returns {boolean}
         */
        function getJiraApiInfo() {
            let customRecordSearch = search.create({
                type: "customrecord_jj_jira_api_info",
                filters: [
                    ["internalid", "anyof", "1"]
                ],
                columns: [

                    search.createColumn({ name: "custrecord_jj_api_token" }),
                    search.createColumn({ name: "custrecord_jj_domain_url" }),
                    search.createColumn({ name: "custrecord_jj_username" }),
                    search.createColumn({ name: "custrecord_jj_jira_task_url" })
                ]
            });
            let searchResults = [];
            customRecordSearch.run().each(function (result) {
                searchResults.push({
                    apiToken: result.getValue({ name: "custrecord_jj_api_token" }),
                    domainUrl: result.getValue({ name: "custrecord_jj_domain_url" }),
                    username: result.getValue({ name: "custrecord_jj_username" }),
                    jiraTaskUrl: result.getValue({ name: "custrecord_jj_jira_task_url" })
                });
                return true;
            });
            return searchResults;
        }


        /**
         * This function is used to retrieve the string of a particular issue key from the JIRA URL from saved search.
         * @param {*} jiraTaskUrl 
         * @returns 
         */
        function extractStringFromURL(jiraTaskUrl) {
            let parts = jiraTaskUrl.split('?selectedIssue=');
            let splitString = parts.length > 1 ? parts[1] : '';
            return splitString;
        }



        /**
         * This function is the Http request of JIRA APIs to get the response.
         * @param {*} url 
         * @param {*} headers 
         * @returns 
         */
        function sendHttpGetRequest(url, headers) {
            let response = https.get({ url: url, headers: headers });
            if (response.code === 200) {
                return JSON.parse(response.body); // returns the parsed JSON body of the response
            } else {
                log.error('HTTP GET Request Error', response);
                return null; // returns null to indicate an error occurred
            }
        }



        /**
         * This function is used to convert the username and API Token to Base 64 key for the authorization purpose and return the key value pair with the rest of the headers.
         * @param {*} username 
         * @param {*} apiToken 
         * @returns 
         */
        function createAuthorizationHeader(username, apiToken) {
            let encodedCredentials = encode.convert({
                string: username + ':' + apiToken,
                inputEncoding: encode.Encoding.UTF_8,
                outputEncoding: encode.Encoding.BASE_64
            });

            return {
                "Authorization": "Basic " + encodedCredentials,
                "Content-Type": "application/json",
                "Accept": "*/*",
                "Accept-Encoding": "gzip, deflate, br"
            };
        }

        /**
         * This function is used to fetch all projects from an username
         * @param {*} username 
         * @param {*} apiToken 
         * @param {*} domainUrl 
         * @returns 
         */
        function fetchProjects(username, apiToken, domainUrl) {
            let headers = createAuthorizationHeader(username, apiToken);
            let url = domainUrl + "/rest/api/3/project";
            let responseBody = sendHttpGetRequest(url, headers);
            return responseBody; // Return an array of these objects
        }



        /**
         * This function is used to fetch all the Epic issues from a project 
         * @param {*} username 
         * @param {*} apiToken 
         * @param {*} domainUrl 
         * @param {*} ids 
         * @returns 
         */
        function fetchEpicIssues(username, apiToken, domainUrl) {
            let headers = createAuthorizationHeader(username, apiToken);
            let url = domainUrl + "/rest/api/3/search?jql=type = Epic&fields=*all" ;
            let responseBody = sendHttpGetRequest(url, headers);
            return responseBody;
        }
        

        
        /**
         * This function is used to fetch all the Task issues from a project 
         *
         * @param {*} username
         * @param {*} apiToken
         * @param {*} domainUrl
         * @returns {*}
         */
        function fetchTaskIssues(username, apiToken, domainUrl) {
            let headers = createAuthorizationHeader(username, apiToken);
            let url = domainUrl + "/rest/api/3/search?jql=type = Task&fields=*all" ;
            let responseBody = sendHttpGetRequest(url, headers);
            return responseBody;
        }

        
        /**
         * This function is used to fetch all the Story issues from a project 
         *
         * @param {*} username
         * @param {*} apiToken
         * @param {*} domainUrl
         * @returns {*}
         */
        function s(username, apiToken, domainUrl) {
            let headers = createAuthorizationHeader(username, apiToken);
            let url = domainUrl + "/rest/api/3/search?jql=type = Story&fields=*all" ;
            let responseBody = sendHttpGetRequest(url, headers);
            return responseBody;
        }

        
        /**
         * This function is used to fetch all the Bug issues from a project 
         *
         * @param {*} username
         * @param {*} apiToken
         * @param {*} domainUrl
         * @returns {*}
         */
        function fetchBugIssues(username, apiToken, domainUrl) {
            let headers = createAuthorizationHeader(username, apiToken);
            let url = domainUrl + "/rest/api/3/search?jql=type = Bug&fields=*all" ;
            let responseBody = sendHttpGetRequest(url, headers);
            return responseBody;
        }

        
        /**
         * This function is used to fetch all the SubTask issues from a project 
         *
         * @param {*} username
         * @param {*} apiToken
         * @param {*} domainUrl
         * @returns {*}
         */
        function fetchSubTaskIssues(username, apiToken, domainUrl) {
            let headers = createAuthorizationHeader(username, apiToken);
            let url = domainUrl + "/rest/api/3/search?jql=type = Subtask&fields=*all" ;
            let responseBody = sendHttpGetRequest(url, headers);
            return responseBody;
        }
        
        
        /**
         * This function returns the last Updated date of the Issue in the Project.
         *
         * @param {*} username
         * @param {*} apiToken
         * @param {*} domainUrl
         * @returns {*}
         */
        function lastUpdatedIssueDate(username, apiToken, domainUrl) {
            let headers = createAuthorizationHeader(username, apiToken);
            let url = domainUrl + "/rest/api/3/project/recent?expand=insight";
            let responseIssueDate = sendHttpGetRequest(url, headers);
            log.debug("lastUpdatedIssueDate", responseIssueDate);
            let lastIssueUpdateTimes = responseIssueDate.map(dateUpdate => dateUpdate.insight.lastIssueUpdateTime);
            log.debug("lastIssueUpdateTimes", lastIssueUpdateTimes);
            return lastIssueUpdateTimes;
        }
        
        
        /**
         * This function converts the lastUpdated date into the correct Format that can be included in the API Response
         *
         * @param {*} dateString
         * @returns {string}
         */
        function formatIssueUpdateTime(dateString) {
            let date = new Date(dateString);
            let year = date.getFullYear();
            let month = (date.getMonth() + 1).toString().padStart(2, '0'); // January is 0!
            let day = date.getDate().toString().padStart(2, '0');
            let hours = date.getHours().toString().padStart(2, '0');
            let minutes = date.getMinutes().toString().padStart(2, '0');
            let formattedDate = `${year}/${month}/${day} ${hours}:${minutes}`;
            return formattedDate;
        }


        
        /**
         * This function gets the issue from the lastUpdatedDate provided above.
         *
         * @param {*} username
         * @param {*} apiToken
         * @param {*} domainUrl
         * @param {*} dateArray
         * @returns {{ responses: {}; }}
         */
        function issuesFromDate(username, apiToken, domainUrl, dateArray) {
            let headers = createAuthorizationHeader(username, apiToken);
            let responses = [];

            for (let i = 0; i < dateArray.length; i++) {
                let formatDate = "\"" + dateArray[i] + "\"";
                let url = domainUrl + "/rest/api/3/search?jql=updated >= " + formatDate + "&fields=*all";
                let response = sendHttpGetRequest(url, headers);

                if (response && response.issues) {
                    for (let issue of response.issues) {
                        let projectKey = issue.fields.project.key;
                        let issuekey = issue.key;
                        let summary = issue.fields.summary;
                        let parent = issue.fields.parent ? issue.fields.parent.key : null;
                        let company = issue.fields.project.name;
                        let assignee = issue.fields.assignee ? issue.fields.assignee.emailAddress : null;
                        let reporter = issue.fields.reporter ? issue.fields.reporter.emailAddress : null;
                        let statusName = issue.fields.status.name;
                        let originalEstimate = issue.fields.timeoriginalestimate;
                        let dueDate = issue.fields.duedate;
                        let startDate = issue.fields.customfield_10015;
                        let timeEstimate = issue.fields.timeestimate;
                        let statusConvert = "";
                        if (statusName == 'To Do') {
                            statusConvert = "Not Started";
                        } else if (statusName == 'In Progress' || 'In QA') {
                            statusConvert == 'In Progress - YELLOW';
                        } else
                            statusConvert == 'Completed';
                        responses.push({
                            "projectKey": projectKey, "issuekey": issuekey, "formatDate": formatDate, "summary": summary, "parent": parent, "company": company, "assignee": assignee, "reporter": reporter, "statusName": statusConvert,
                            "originalEstimate": originalEstimate, "dueDate": dueDate, "startDate": startDate, "timeEstimate": timeEstimate
                        });
                        
                    }
                }
                log.debug("responses", responses);
                return { responses };
            }
        }



            

            return {
                getJiraApiInfo: getJiraApiInfo,
                isProduction: configFunction.isProduction,
                extractStringFromURL: extractStringFromURL,
                sendHttpGetRequest: sendHttpGetRequest,
                createAuthorizationHeader: createAuthorizationHeader,
                fetchProjects: fetchProjects,
                fetchEpicIssues: fetchEpicIssues,
                fetchTaskIssues:fetchTaskIssues,
                fetchStoryIssues: fetchStoryIssues,
                fetchBugIssues: fetchBugIssues,
                fetchSubTaskIssues: fetchSubTaskIssues,
                lastUpdatedIssueDate: lastUpdatedIssueDate,
                formatIssueUpdateTime: formatIssueUpdateTime,
                issuesFromDate: issuesFromDate
         
        
            }

        });