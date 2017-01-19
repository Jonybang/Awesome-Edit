angular
    .module('a-edit')
    .service('AEditAjaxHelper', [function(){

        return function AjaxHelper(resource, queryOptions){
            var self = this;

            self.resource = resource;

            self.paging = {
                current: 1,
                per_page: queryOptions && queryOptions._limit ? queryOptions._limit : 10
            };

            self.params = {
                _config: 'meta-total-count,meta-filter-count'
            };

            if(queryOptions){
                angular.extend(self.params, queryOptions)
            }

            self.search = '';

            self.sorting = { };

            self.defaultSorting = {};
            if(queryOptions && queryOptions._sort)
                self.defaultSorting[queryOptions._sort.replace("-", "")] = queryOptions._sort.indexOf('-') == -1 ? 'ASC' : 'DESC';
            else
                self.defaultSorting['id'] = 'DESC';

            self.getData = function(options){
                if(options){
                    if(options.is_add_next_page)
                        self.paging.current++;
                    if(options.is_search_changed)
                        self.paging.current = 1;
                }

                self.prepareQuery();

                var params = options && options.is_exclude_params ? {} : self.temp_params;
                var result = self.resource.query(params, function(data, headers){
                    self.paging.total_items = headers('Meta-Filter-Count');
                });
                result.$promise = result.$promise.then(function(data){
                    if(options && options.is_add_next_page)
                        self.data = _.concat(self.data, data);
                    else
                        self.data = data;
                    return self.data;
                });
                return result;
            };

            self.getAllData = function(){
                self.prepareQuery();
                delete self.temp_params._limit;
                delete self.temp_params._offset;
                return self.resource.query(self.temp_params, function(data, headers){
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
                return self.temp_params;
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
                    if (name.includes('-lk')) {
                        self.temp_params[name] = '*' + value + '*';
                    } else if(name.includes('-in') && value && value.join) {
                        if(value.length)
                            self.temp_params[name] = value.join(',');
                        else
                            delete self.temp_params[name];
                    }
                });
            }
        };
    }]);