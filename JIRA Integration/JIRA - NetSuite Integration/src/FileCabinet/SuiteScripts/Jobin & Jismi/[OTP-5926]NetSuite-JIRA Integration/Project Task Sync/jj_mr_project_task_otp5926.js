/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/config', 'N/https', 'N/log', 'N/record', 'N/search', 'N/url', '../Common Module/jj_cm_common_library.js'],
    /**
 * @param{config} config
 * @param{https} https
 * @param{log} log
 * @param{record} record
 * @param{search} search
 * @param{url} url
 */
    (config, https, log, record, search, url, jiraLib) => {

        /**
         * Defines the function that is executed at the beginning of the map/reduce process and generates the input data.
         * @param {Object} inputContext
         * @param {boolean} inputContext.isRestarted - Indicates whether the current invocation of this function is the first
         *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
         * @param {Object} inputContext.ObjectRef - Object that references the input data
         * @typedef {Object} ObjectRef
         * @property {string|number} ObjectRef.id - Internal ID of the record instance that contains the input data
         * @property {string} ObjectRef.type - Type of the record instance that contains the input data
         * @returns {Array|Object|Search|ObjectRef|File|Query} The input data to use in the map/reduce process
         * @since 2015.2
         */

        const getInputData = (inputContext) => {

            // Check environment
            let isProd = jiraLib.isProduction();
            log.debug('Environment', isProd ? 'Production' : 'Non-Production');

            let values = jiraLib.getJiraApiInfo();
            log.debug("the search values are :", values);

          

            if (values.length > 0) {
                let domainUrl = values[0].domainUrl;
                let jiraTaskUrl = values[0].jiraTaskUrl;
                let apiToken = values[0].apiToken;
                let issueKey = jiraLib.extractStringFromURL(jiraTaskUrl);
                let username = values[0].username;
                log.debug('issueKey', issueKey);

                let project = jiraLib.fetchProjects(username, apiToken, domainUrl);
                log.debug("project", project)
                let obj = project.map(function (proj) {
                    return {
                        id: proj.id,
                        key: proj.key
                    }

                });
                log.debug("projectids", obj);

               
                let epicIssues = jiraLib.fetchEpicIssues(username, apiToken, domainUrl);
                log.debug("epicIssues", epicIssues);

                let taskIssues = jiraLib.fetchTaskIssues(username, apiToken, domainUrl);
                log.debug("taskIssues", taskIssues);

                let storyIssues = jiraLib.fetchStoryIssues(username, apiToken, domainUrl);
                log.debug("storyIssues", storyIssues);

                let bugIssues = jiraLib.fetchBugIssues(username, apiToken, domainUrl);
                log.debug("bugIssues", bugIssues);

                let subTaskIssues = jiraLib.fetchSubTaskIssues(username, apiToken, domainUrl);
                log.debug("subTaskIssues", subTaskIssues);


                let issueLastUpdated = jiraLib.lastUpdatedIssueDate(username, apiToken, domainUrl);
                let formattedDateArray = issueLastUpdated.map(dateString => jiraLib.formatIssueUpdateTime(dateString));
                log.debug("formattedDateArray", formattedDateArray);

                let issuesForDate = jiraLib.issuesFromDate(username,apiToken, domainUrl,formattedDateArray);           

                return issuesForDate;

        }
    }



        /**
         * Defines the function that is executed when the reduce entry point is triggered. This entry point is triggered
         * automatically when the associated map stage is complete. This function is applied to each group in the provided context.
         * @param {Object} reduceContext - Data collection containing the groups to process in the reduce stage. This parameter is
         *     provided automatically based on the results of the map stage.
         * @param {Iterator} reduceContext.errors - Serialized errors that were thrown during previous attempts to execute the
         *     reduce function on the current group
         * @param {number} reduceContext.executionNo - Number of times the reduce function has been executed on the current group
         * @param {boolean} reduceContext.isRestarted - Indicates whether the current invocation of this function is the first
         *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
         * @param {string} reduceContext.key - Key to be processed during the reduce stage
         * @param {List<String>} reduceContext.values - All values associated with a unique key that was passed to the reduce stage
         *     for processing
         * @since 2015.2
         */
        const reduce = (reduceContext) => {

            let issueData = reduceContext.values[0];
            log.debug("issueData", issueData);

        }
        return { getInputData, reduce }
    });