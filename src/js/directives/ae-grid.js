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
                track_by: '',
                default_attrs: {},
                modal_index: 0,
                search_debounce: 200,
                fields: [],
                lists: {},
                callbacks: {}
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


                var tplHtml = '' +
                    '<md-content layout="column" flex="grow" layout-wrap class="padding">' +
                    '   <md-list flex>' +
                    '       <md-subheader class="md-no-sticky">';

                if(scope.actualOptions.search){
                    tplHtml +=
                        '       <md-input-container class="md-block no-margin" flex="grow">' +
                        '           <label>Поиск</label>' +
                        '           <input ng-model="searchQuery" ng-change="getFiles()"  ng-model-options="{ debounce: ' + scope.actualOptions.search_debounce + ' }">' +
                        '       </md-input-container>';
                }

                tplHtml += '' +
                    '           <span>{{actualOptions.caption}}</span>' +
                    '       </md-subheader>';

                var tplHead =
                    '<md-list-item class="md-1-line">' +
                    '   <md-grid-list>';

                var tplBodyNewItem =
                        '<md-list-item class="md-1-line">' +
                        '   <md-content layout="row" flex="grow">' +
                        '       <md-grid-list>';

                if(!scope.actualOptions.track_by)
                    scope.actualOptions.track_by = mode == 'remote' ? 'id' : 'json_id';

                var tplBodyItem =
                        '<md-list-item class="md-1-line word-wrap" ng-repeat="item in filtredList track by item.' + scope.actualOptions.track_by + '">' +
                        '   <md-content layout layout-fill layout-align="center" flex="grow">' +
                        '       <md-grid-list>';

                var tableFieldsCount = 0;
                scope.actualOptions.fields.forEach(function(field){
                    if(!field.table_hide)
                        tableFieldsCount++;
                });
                //var defaultWidth = Math.ceil(100 / tableFieldsCount-1);
                var defaultWidth = AEditHelpers.round5(100 / tableFieldsCount);

                var select_list_request_options = {};
                select_list_request_options[variables['limit']] = scope.gridOptions.select_options.items_per_page;
                scope.actualOptions.fields.forEach(function(field, index){
                    if(!field.width)
                        field.width = defaultWidth;

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
                    if(field.fields){
                        scope[field.name + '_fields'] = field.fields;
                    }

                    tplHead +=
                        '<md-grid-tile flex="{{actualOptions.fields[' + index + '].width}}"><sorting ng-model="ajaxGrid.sorting.' + field.name + '" ng-change="getFiles()">' + field.label + '</sorting></md-grid-tile>';
                    //
                    //var style = 'style="';
                    //if(field.width)
                    //    style += 'width:' + field.width + ';';
                    //style += '"';

                    //for new item row
                    tplBodyNewItem +=
                        '<div flex="{{actualOptions.fields[' + index + '].width}}">';
                    //for regular item row
                    tplBodyItem +=
                        '<div flex="{{actualOptions.fields[' + index + '].width}}" ng-dblclick="item.is_edit = !item.is_edit">';

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
                            no_label: true,
                            list_variable: list_variable,
                            get_list: false,
                            ajax_search: AEditConfig.search
                        });
                    }

                    tplBodyNewItem += getFieldDirective(true) +
                        '</div>';
                    tplBodyItem += getFieldDirective(false) +
                        '</div>';
                });

                if(scope.actualOptions.edit){
                    tplHead +=
                        '<div flex></div>';

                    tplBodyNewItem +=
                        '<div flex>' +
                            '<md-button class="md-fab md-mini md-primary" ng-click="save(new_item)">' +
                                '<md-icon>save</md-icon>' +
                            '</md-button>' +
                        '</div>';

                    tplBodyItem +=
                        '<div flex>' +
                            '<md-menu>' +
                                '<md-button class="md-icon-button" ng-click="$mdOpenMenu($event)"><md-icon md-menu-origin>more_vert</md-icon></md-button>' +
                                '<md-menu-content width="4">' +
                                    '<md-menu-item ng-show="item.is_edit"><md-button ng-click="save(item)"><md-icon md-menu-align-target>save</md-icon>Save</md-button></md-menu-item>' +
                                    '<md-menu-item ng-hide="item.is_edit"><md-button ng-click="item.is_edit = true"><md-icon md-menu-align-target>mode_edit</md-icon>Edit</md-button></md-menu-item>' +
                                    (scope.actualOptions.delete ? '<md-menu-item><md-button ng-click="deleteConfirm(item)"><md-icon md-menu-align-target>delete</md-icon>Delete</md-button></md-menu-item>' : '') +
                                '</md-menu-content>' +
                            '</md-menu>' +
                        '</div>';
                }

                tplHead +=
                    '</md-list-item>';

                tplBodyNewItem +=
                        '</md-content>' +
                    '</md-list-item>';

                tplBodyItem +=
                        '</md-content>' +
                    '</md-list-item>';

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

                var template = angular.element('<md-content layout flex>' + tplHtml + tableHtml + '</md-content>');

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

                    if(scope.actualOptions.callbacks.onSave)
                        $timeout(scope.actualOptions.callbacks.onSave);

                    if(scope.ngChange)
                        $timeout(scope.ngChange);

                    if(scope.actualOptions.callbacks.onChange)
                        $timeout(scope.actualOptions.callbacks.onChange);

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
                        var track_by = scope.actualOptions.track_by;

                        item[track_by] = 1;
                        scope.ngModel.forEach(function(local_item){
                            if(local_item[track_by] >= item[track_by])
                                item[track_by] = local_item[track_by] + 1;
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

                    if(scope.actualOptions.callbacks.onChange)
                        $timeout(scope.actualOptions.callbacks.onChange);
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
                    var track_by = scope.actualOptions.track_by;
                    list.forEach(function(item, index){
                        if(!item[track_by] || item[track_by] == 0)
                            item[track_by] = list.length + index + 1;
                    })
                }

                scope.search();
                scope.actualOptions.lists['self'] = list;
            });
        }
    };
}]);
