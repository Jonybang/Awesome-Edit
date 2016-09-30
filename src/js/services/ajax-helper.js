angular
    .module('a-edit')
    .service('AEditAjaxHelper', [function(){

        return function AjaxHelper(resource, queryOptions){
            var self = this;

            self.resource = resource;

            self.params = {
                _limit: 15,
                _config: 'meta-total-count,meta-filter-count'
            };

            if(queryOptions){
                angular.extend(self.params, queryOptions)
            }

            self.paging = {
                current: 1,
                per_page: 10
            };

            self.search = '';

            self.sorting = { };

            self.defaultSorting = {};
            if(queryOptions && queryOptions._sort)
                self.defaultSorting[queryOptions._sort.replace("-", "")] = queryOptions._sort.indexOf('-') == -1 ? 'ASC' : 'DESC';
            else
                self.defaultSorting['id'] = 'DESC';

            self.getData = function(is_exclude_params){
                self.prepareQuery();

                return self.resource.query(is_exclude_params ? {} : self.temp_params, function(data, headers){
                    self.data = data;
                    self.paging.total_items = headers('Meta-Filter-Count');
                    return data;
                });
            };

            self.prepareQuery = function(){
                self.temp_params = angular.copy(self.params);

                self.searchToQuery();
                self.pagingToQuery();
                self.sortingToQuery();
                self.likeParamsToQuery();
            };

            self.searchToQuery = function(){
                if(self.search)
                    self.temp_params._q = self.search;
                else
                    delete self.temp_params._q;
            };

            self.pagingToQuery = function(){
                if(!self.paging)
                    return;

                self.temp_params._limit = self.paging.per_page;
                self.temp_params._offset = (self.paging.current - 1) * self.paging.per_page;
            };

            self.sortingToQuery = function(){
                self.temp_params._sort = '';

                var sorting = _.isEmpty(self.sorting) ? self.defaultSorting : self.sorting;

                if(!sorting)
                    return;

                _.forEach(sorting, function(value, name){
                    if(!value)
                        return;

                    if(self.temp_params._sort)
                        self.temp_params._sort += ',';

                    if(value == 'DESC')
                        self.temp_params._sort += '-';

                    self.temp_params._sort += name;
                });
            };

            self.likeParamsToQuery = function(){
                angular.forEach(self.temp_params, function callback(value, name){
                    if (name.indexOf('-lk') != -1) {
                        self.temp_params[name] = '*' + value + '*';
                    }
                });
            }
        };
    }]);