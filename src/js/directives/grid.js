angular
    .module('a-edit')
    .directive('aeGrid', ['$timeout', '$compile', '$filter', 'AEditHelpers', 'AEditConfig', function($timeout, $compile, $filter, AEditHelpers, AEditConfig) {
    return {
        restrict: 'E',
        require: 'ngModel',
        scope: {
            //require
            ngModel: '=',
            //sub
            options: '=',
            //callbacks
            ngChange: '&',
            onSave: '&'
        },
        link: function (scope, element, attrs, ngModel) {
            var defaultOptions = {
                search: true,
                create: true,
                edit: true,
                delete: true,
                paginate: false,
                bold_headers: true,
                modal_adder: false,
                ajax_handler: false,
                resource: null,
                order_by: '-id',
                default_attrs: {},
                modal_index: 0,
                search_debounce: 200,
                fields: [],
                lists: {}
            };

            var new_item = {
                is_new: true
            };
            scope.new_item = angular.copy(new_item);
            scope.status = "";

            var mode = 'local';

            //request options for get list
            scope.gridRequestOptions = {};
            //actual options of grid controls
            scope.gridOptions = {};

            scope.gridOptions.current_page = 1;

            var variables = angular.extend({}, AEditConfig.grid_options.request_variables, AEditConfig.grid_options.response_variables);

            // *************************************************************
            // TEMPLATE INIT
            // *************************************************************

            scope.$watch('options', function(){
                if(!scope.options)
                    return;

                scope.actualOptions = angular.extend({}, defaultOptions, scope.options);
                AEditConfig.current_options = scope.actualOptions;
                
                angular.extend(scope.gridOptions, AEditConfig.grid_options, scope.actualOptions);
                scope.gridOptions.select_options = angular.extend({}, AEditConfig.grid_options, scope.actualOptions);

                if(scope.actualOptions.resource){
                    mode = 'remote';
                    if(scope.actualOptions.get_list)
                        scope.getList();
                }

                var tplSearch =
                    '<div class="input-group">' +
                        '<input type="text" class="form-control" ng-model="searchQuery" placeholder="Search" ng-model-options="{ debounce: ' + scope.actualOptions.search_debounce + ' }"/>' +
                        '<span class="input-group-btn">' +
                            '<button class="btn btn-default" ng-click="clearSearch()"><i class="glyphicon glyphicon-remove"></i></button>' +
                        '</span>' +
                    '</div>';

                var tplHead =
                    '<table class="table table-hover bootstrap-table">' +
                        '<caption>{{actualOptions.caption}}</caption>' +
                        '<thead>' +
                            '<tr>';

                var tplBodyNewItem =
                        '<tbody>' +
                            '<tr>';

                var tplBodyItem =
                        '<tbody>' +
                            '<tr ng-repeat="item in filtredList track by item.' + (mode == 'remote' ? 'id' : 'json_id') + '">';


                var select_list_request_options = {};
                select_list_request_options[variables['limit']] = scope.gridOptions.select_options.items_per_page;
                scope.actualOptions.fields.forEach(function(field, index){
                    if(field.resource && field.list && field.list != 'self'){
                        if(!scope.actualOptions.lists[field.list]){
                            scope.actualOptions.lists[field.list] = [];

                            AEditHelpers.getResourceQuery(field.resource, 'get', select_list_request_options).then(function(response){
                                scope.actualOptions.lists[field.list] = response[variables['list']] || response;
                            });
                        }
                    }

                    if(field.table_hide)
                        return;

                    if(field.resource){
                        scope[field.name + '_resource'] = field.resource;
                    }

                    var headerEl = scope.actualOptions.bold_headers ? 'th' : 'td';
                    tplHead += '<' + headerEl + '>' + field.label + '</' + headerEl + '>';

                    var style = 'style="';
                    if(field.width)
                        style += 'width:' + field.width + ';';
                    style += '"';

                    //for new item row
                    tplBodyNewItem += '<td><div ' + style + ' >';
                    //for regular item row
                    tplBodyItem += '<td ng-dblclick="item.is_edit = !item.is_edit"><div ' + style + ' >';

                    function getFieldDirective(is_new) {
                        var item_name = (is_new ? 'new_' : '' ) + 'item';
                        var field_name = field.name != 'self' ? field.name : '';

                        var list_variable;

                        if(field.list && field.list == 'self')
                            list_variable = 'ngModel';
                        else if(field.list)
                            list_variable = 'actualOptions.lists.' + field.list;

                        return AEditHelpers.generateDirectiveByConfig(field, {
                            item_name: item_name,
                            field_name: field_name,
                            readonly: field.readonly || !scope.actualOptions.edit,
                            always_edit: is_new,
                            is_new: is_new,
                            list_variable: list_variable,
                            get_list: false,
                            ajax_search: AEditConfig.se
                        });
                    }

                    tplBodyNewItem += getFieldDirective(true) + '</div></td>';
                    tplBodyItem += getFieldDirective(false) + '</div></td>';
                });

                if(scope.actualOptions.edit){
                    tplHead +=
                        '<th class="controls"></th>';

                    tplBodyNewItem +=
                        '<td class="controls">' +
                            '<icon-button type="primary" glyphicon="floppy-disk" ng-click="save(new_item)" size="sm"></icon-button>' +
                        '</td>';

                    tplBodyItem +=
                        '<td class="controls">' +
                            '<icon-button ng-show="item.is_edit" type="primary" glyphicon="floppy-disk" ng-click="save(item)"></icon-button>' +
                            '<icon-button ng-hide="item.is_edit" type="warning" glyphicon="pencil" ng-click="item.is_edit = true"></icon-button>' +
                            ( scope.actualOptions.delete ? '<icon-button type="danger" glyphicon="remove" ng-click="deleteConfirm(item)"></icon-button>' : '' ) +
                        '</td>';
                }

                tplHead +='</tr></thead>';

                tplBodyNewItem +='</tr>';

                tplBodyItem +='</tr></tbody></table>';

                var tplHtml = '';

                if(scope.actualOptions.search)
                    tplHtml += tplSearch;

                var tableHtml = '';

                tableHtml += tplHead;

                if(scope.actualOptions.create){

                    if(scope.actualOptions.modal_adder)
                        tplHtml += '<button class="btn btn-success" ng-click=""><span class="glyphicon glyphicon-plus"></span> Add</button>';
                    else
                        tableHtml += tplBodyNewItem;
                }

                tableHtml += tplBodyItem;

                if(scope.actualOptions.paginate) {
                    tableHtml += '<uib-pagination total-items="gridOptions.filter_items" items-per-page="gridOptions.items_per_page" ng-model="gridOptions.current_page" ng-change="getList()"></uib-pagination>';
                }

                angular.element(element).html('');

                var template = angular.element('<div>' + tplHtml + tableHtml + '</div>');

                angular.element(element).append($compile(template)(scope));
            });
            
            scope.$watchCollection('options.lists', function(new_lists) {
                angular.extend(scope.actualOptions.lists, new_lists);
            });

            // *************************************************************
            // GET LIST, SEARCH, PAGINATION AND SORTING
            // *************************************************************

            scope.getList = function(){
                var query_name = 'get';

                if(scope.actualOptions.ajax_handler){

                    if(scope.searchQuery)
                        scope.gridRequestOptions[variables['query']] = scope.searchQuery;
                    else
                        delete scope.gridRequestOptions[variables['query']];

                    if(scope.actualOptions.order_by)
                        scope.gridRequestOptions[variables['sort']] = scope.actualOptions.order_by;

                    if(scope.actualOptions.paginate){
                        scope.gridRequestOptions[variables['offset']] = (scope.gridOptions.current_page - 1) * scope.gridOptions.items_per_page;
                        scope.gridRequestOptions[variables['limit']] = scope.gridOptions.items_per_page;
                    }

                    angular.extend(scope.gridRequestOptions, scope.gridOptions.additional_request_params);

                    query_name = 'search';
                }


                AEditHelpers.getResourceQuery(scope.actualOptions.resource, query_name, scope.gridRequestOptions).then(function(response){
                    scope.ngModel = response[variables['list']] || response;

                    var meta_info = response[variables['meta_info']];
                    if(meta_info){
                        scope.gridOptions.total_items = meta_info[variables['total_count']];
                        scope.gridOptions.filter_items = meta_info[variables['filter_count']];
                    } else {
                        console.error('[AEGrid] For pagination needs some meta info in response!');
                    }
                });
            };

            // *************************************************************
            // CLIENT SEARCH
            // *************************************************************

            scope.search = function(newQuery, oldQuery){
                scope.filtredList = scope.ngModel;

                if(newQuery == oldQuery && scope.actualOptions.ajax_handler)
                    return;

                if(scope.actualOptions.ajax_handler){
                    scope.getList();
                    return;
                }

                if(scope.searchQuery)
                    scope.filtredList = $filter('filter')(scope.ngModel, scope.searchQuery);

                if(scope.actualOptions.order_by)
                    scope.filtredList = $filter('orderBy')(scope.filtredList, scope.actualOptions.order_by);
            };

            scope.$watch('searchQuery', scope.search);

            scope.clearSearch = function(){
                scope.searchQuery = '';
                scope.filtredList = scope.ngModel;
            };

            // *************************************************************
            // CREATE OR UPDATE
            // *************************************************************

            scope.save = function(item){
                if(!item)
                    return;

                item.errors || (item.errors = {});

                // validation - check required fields and password
                scope.actualOptions.fields.forEach(function(field){
                    //if field empty and required - add to errors, else delete from errors
                    if(field.required && !item[field.name])
                        item.errors[field.name] = true;
                    else if(item.errors[field.name])
                        delete item.errors[field.name];

                    //if password not changed and not new object
                    if(field.type == 'password' && item.id)
                        delete item.errors[field.name];

                    //if password not changed delete field from request data
                    if(field.type == 'password' && !item[field.name])
                        delete item[field.name];
                });

                // if there some errors
                if(!AEditHelpers.isEmptyObject(item.errors))
                    return;

                // actions after save
                function saveCallbacks(item){
                    if(scope.onSave)
                        $timeout(scope.onSave);

                    if(scope.ngChange)
                        $timeout(scope.ngChange);

                    scope.search();

                    item.is_edit = false;

                    scope.status = item.name + " saved!";
                    $timeout(function(){
                        scope.status = "";
                    }, 1000);

                    if(mode != 'remote'){
                        delete item.is_new;
                        delete item.is_edit;
                        delete item.errors;
                    }
                }

                // local json mode
                if(mode != 'remote'){
                    if(item.is_new){

                        item.json_id = 1;
                        scope.ngModel.forEach(function(local_item){
                            if(local_item.json_id >= item.json_id)
                                item.json_id = local_item.json_id + 1;
                        });

                        scope.ngModel.unshift(item);
                        scope.new_item = angular.copy(new_item);
                    }

                    saveCallbacks(item);

                    return;
                }

                var request_object = angular.copy(item);

                // check for files from file uploader
                var uploaders = Object.keys(request_object).filter(function(k){ return ~k.indexOf("__uploader") });
                // if exists - upload each file and set to *field*_ids array database object of file
                // TODO: realize mode for take paths of files(not ids of database rows with paths)
                if(uploaders.length){

                    uploaders.forEach(function(key){

                        function sendAll(){
                            var prop_name = key.replace('__uploader','');
                            if(!request_object[prop_name]){
                                sendItem();
                                return;
                            }

                            request_object[prop_name.substring(0, prop_name.length - 1) + '_ids'] = request_object[prop_name].map(function(obj){
                                return obj.id;
                            });
                            delete request_object[key];
                            delete request_object[prop_name];
                            sendItem();
                        }

                        if(!request_object[key].queue.length){
                            sendAll();
                        } else {
                            request_object[key].onSuccessItem = function(){
                                if(!request_object[key].queue.length){
                                    sendAll();
                                }
                            };
                        }
                    });
                } else {
                    sendItem();
                }

                function sendItem(){
                    var resource = new scope.actualOptions.resource(request_object);

                    if('id' in request_object && request_object.id){
                        // update if id field exist
                        AEditHelpers.getResourceQuery(resource, 'update').then(function(updated_item){
                            angular.extend(item, updated_item);

                            saveCallbacks(item);
                        });
                    } else {
                        //create if id not exist
                        angular.forEach(scope.actualOptions.default_attrs, function(value, attr){
                            request_object[attr] = value;
                        });

                        AEditHelpers.getResourceQuery(resource, 'create').then(function(created_item){
                            created_item.is_new = true;

                            scope.ngModel.unshift(created_item);
                            delete scope.new_item;
                            scope.new_item = angular.copy(new_item);

                            saveCallbacks(item);
                        });
                    }
                }
            };
            // *************************************************************
            // DELETE
            // *************************************************************

            scope.deleteConfirm = function(item){
                var index = scope.ngModel.indexOf(item);

                function deleteCallbacks(){
                    scope.ngModel.splice(index, 1);
                    if(scope.ngChange)
                        $timeout(scope.ngChange);
                }
                if(mode != 'remote'){
                    deleteCallbacks();
                    return;
                }

                if(confirm('Do you want delete object "' + (item.name || item.key || item.title) + '"?')){
                    AEditHelpers.getResourceQuery(new scope.actualOptions.resource(item), 'delete').then(function(){
                        deleteCallbacks();
                    });
                }
            };

            // *************************************************************
            // WATCHERS
            // *************************************************************

            scope.$watchCollection('ngModel', function(list){
                if(!list)
                    return;

                if(mode == 'local'){
                    list.forEach(function(item, index){
                        if(!item.json_id)
                            item.json_id = list.length + index + 1;
                    })
                }

                scope.search();
                scope.actualOptions.lists['self'] = list;
            });
        }
    };
}]);
