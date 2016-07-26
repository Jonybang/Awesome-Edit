/**
 * Created by jonybang on 04.07.15.
 */
angular.module('a-edit')
    .factory('AEditConfig', [function() {
        this.templates_path = 'templates/';

        this.current_options = {};

        this.grid_options = {
            request_variables: {
                query: '_q',
                offset: '_offset',
                limit: '_limit',
                sort: '_sort',
                page: '_page'
            },
            additional_request_params:{},
            response_variables: {
                meta_info: 'meta', //container for total_count, current_page and etc.
                list: 'data', //container for data of response
                total_count: 'total_count',
                filter_count: 'filter_count'
            },
            items_per_page: 15
        };

        this.select_options = {
            ajax_handler: true,
            items_per_page: 15,
            refresh_delay: 200,
            reset_search_input: true
        };

        return this;
    }]);
