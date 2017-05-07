angular
    .module('a-edit')
    .directive('aeGrid', ['$timeout', '$compile', '$filter', 'AEditHelpers', 'AEditConfig', 'AEditAjaxHelper', function($timeout, $compile, $filter, AEditHelpers, AEditConfig, AEditAjaxHelper) {
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
                onSave: '&',
                onDelete: '&',
                onError: '&'
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
                    drag_disabled: true,
                    resource: null,
                    order_by: '-id',
                    track_by: '',
                    default_attrs: {},
                    params: {},
                    modal_index: 0,
                    search_debounce: 200,
                    fields: [],
                    lists: {},
                    callbacks: {},
                    row_height: '40px'
                };

                var new_item = {
                    is_new: true
                };
                scope.new_item = angular.copy(new_item);
                scope.status = "";

                var mode = 'local';

                var variables = angular.extend({}, AEditConfig.grid_options.request_variables, AEditConfig.grid_options.response_variables);

                // *************************************************************
                // TEMPLATE INIT
                // *************************************************************

                scope.$watchCollection('options', function () {
                    if (!scope.options)
                        return;

                    scope.actualOptions = angular.extend({}, defaultOptions, scope.options);
                    AEditConfig.current_options = scope.actualOptions;

                    var queryOptions = {};
                    queryOptions[variables.sort] = scope.actualOptions.order_by;
                    queryOptions[variables.limit] = AEditConfig.grid_options.items_per_page;

                    scope.ajaxList = new AEditAjaxHelper(scope.actualOptions.resource, queryOptions);

                    scope.select_options = angular.extend({}, AEditConfig.grid_options, scope.actualOptions);

                    if (scope.actualOptions.resource) {
                        mode = 'remote';
                        if (scope.actualOptions.get_list)
                            scope.getList();
                    }

                    var tplHtml = '' +
                        '<div class="ae-grid">' +
                        '       <md-subheader class="md-no-sticky" ng-show="actualOptions.caption || actualOptions.search">';

                    if (scope.actualOptions.search) {
                        tplHtml +=
                            '       <md-input-container class="md-block no-margin" flex="grow">' +
                            '           <label>' + AEditConfig.locale.search + '</label>' +
                            '           <input ng-model="ajaxList.search" ng-model-options="{ debounce: ' + scope.actualOptions.search_debounce + ' }">' +
                            '       </md-input-container>';
                    }

                    tplHtml += '' +
                        '           <span>{{actualOptions.caption}}</span>' +
                        '       </md-subheader>';


                    var visibleFieldsCount = 1;
                    var columnsCount = 1;
                    scope.actualOptions.fields.forEach(function (field) {
                        if (!field.colspan)
                            field.colspan = 1;

                        if (!field.table_hide){
                            visibleFieldsCount++;
                            columnsCount += parseInt(field.colspan);
                        }
                    });

                    var tplHead = '<div class="ae-grid-row">';

                    var tplBodyNewItem = '<div class="ae-grid-row">';

                    if (!scope.actualOptions.track_by)
                        scope.actualOptions.track_by = mode == 'remote' ? 'id' : 'json_id';

                    var track_by = scope.actualOptions.track_by == '$index' ? scope.actualOptions.track_by : 'item.' + scope.actualOptions.track_by;
                    var tplBodyItem =
                        '<div class="ae-grid-row" ng-click="null" ng-repeat="item in filtredList track by ' + track_by + '" dnd-list="filtredList" dnd-draggable="item" dnd-disable-if="actualOptions.drag_disabled" dnd-effect-allowed="move" dnd-moved="filtredList.splice($index, 1)" dnd-drop="drop($index, item)">';

                    var select_list_request_options = {};
                    select_list_request_options[variables['limit']] = scope.select_options.items_per_page;

                    if(!scope.actualOptions.menu_col_percent)
                        scope.actualOptions.menu_col_percent = 10;

                    var availableColPercent = 100 - scope.actualOptions.menu_col_percent;

                    scope.actualOptions.fields.forEach(function (field, index) {

                        if (field.resource && field.list && field.list != 'self') {
                            if(!field.list)
                                field.list = field.name + '_list';

                            if (!scope.actualOptions.lists[field.list]) {
                                scope.actualOptions.lists[field.list] = [];

                                AEditHelpers.getResourceQuery(field.resource, 'get', select_list_request_options).then(function (response) {
                                    scope.actualOptions.lists[field.list] = response[variables['list']] || response;
                                });
                            }
                        }

                        if (field.table_hide)
                            return;

                        if (field.resource)
                            scope[field.name + '_resource'] = field.resource;

                        if (field.fields)
                            scope[field.name + '_fields'] = field.fields;

                        var columnPercent = Math.round(field.colspan/columnsCount * 100);
                        if(columnPercent > availableColPercent)
                            columnPercent = availableColPercent;

                        availableColPercent -= columnPercent;

                        tplHead +=
                            '<div class="ae-grid-col-' + columnPercent + '"><ae-sorting ng-model="ajaxList.sorting.' + field.name + '" ng-change="getList()">' + field.label + '</ae-sorting></div>';
                        //
                        //var style = 'style="';
                        //if(field.width)
                        //    style += 'width:' + field.width + ';';
                        //style += '"';

                        //for new item row
                        tplBodyNewItem +=
                            '<div class="ae-grid-col-' + columnPercent + '">';
                        //for regular item row
                        tplBodyItem +=
                            '<div class="ae-grid-col-' + columnPercent + '" ng-dblclick="editItem(item)">';

                        function getFieldDirective(is_new) {
                            var item_name = (is_new ? 'new_' : '' ) + 'item';
                            var field_name = field.name != 'self' ? field.name : '';

                            var list_variable;

                            if (field.list && field.list == 'self')
                                list_variable = 'ngModel';
                            else if (field.list)
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

                        tplBodyNewItem += getFieldDirective(true) + '</div>';
                        tplBodyItem += getFieldDirective(false) + '</div>';
                    });

                    if (scope.actualOptions.edit) {
                        tplHead +=
                            '<div class="ae-grid-col-' + scope.actualOptions.menu_col_percent + '"></div>';

                        tplBodyNewItem +=
                            '<div class="ae-grid-col-' + scope.actualOptions.menu_col_percent + '">' +
                            '   <md-button class="md-fab md-mini md-primary" ng-click="save(new_item)">' +
                            '       <md-icon>save</md-icon>' +
                            '   </md-button>' +
                            '</div>';

                        tplBodyItem +=
                            '<div class="ae-grid-col-' + scope.actualOptions.menu_col_percent + '">' +
                            '   <md-menu>' +
                            '       <md-button class="md-icon-button" ng-click="$mdOpenMenu($event)"><md-icon md-menu-origin>more_vert</md-icon></md-button>' +
                            '       <md-menu-content width="4">' +
                            '           <md-menu-item ng-show="item.is_edit"><md-button ng-click="save(item)"><md-icon>save</md-icon>' + AEditConfig.locale.save + '</md-button></md-menu-item>' +
                            '           <md-menu-item ng-show="item.id"><md-button ae-object-modal="item" modal-resource-options="actualOptions" on-save="save(item)"><md-icon>open_in_new</md-icon>' + AEditConfig.locale.open + '</md-button></md-menu-item>' +
                            '           <md-menu-item ng-show="item.is_edit"><md-button ng-click="editItem(item)"><md-icon>settings_backup_restore</md-icon>' + AEditConfig.locale.cancel_edit + '</md-button></md-menu-item>' +
                            '           <md-menu-item ng-hide="item.is_edit"><md-button ng-click="item.is_edit = true"><md-icon>mode_edit</md-icon>' + AEditConfig.locale.edit + '</md-button></md-menu-item>' +
                                        (scope.actualOptions.delete ? '<md-menu-item><md-button ng-click="deleteConfirm(item)"><md-icon>delete</md-icon>' + AEditConfig.locale.delete + '</md-button></md-menu-item>' : '') +
                            '       </md-menu-content>' +
                            '   </md-menu>' +
                            '</div>';
                    }

                    tplHead +=
                        '</div>';

                    tplBodyNewItem +=
                        '</div>';

                    tplBodyItem +=
                        '</div>';

                    var tableHtml = '';

                    tableHtml += tplHead;

                    if (scope.actualOptions.create) {

                        if (scope.actualOptions.modal_adder)
                            tplHtml += '<button class="btn btn-success" ng-click=""><span class="glyphicon glyphicon-plus"></span> Add</button>';
                        else
                            tableHtml += tplBodyNewItem;
                    }

                    tableHtml += tplBodyItem;

                    tplHtml += tableHtml + '</div>';

                    if (scope.actualOptions.paginate) {
                        tplHtml += '<ae-paging ng-model="ajaxList.paging" ng-change="getList()"></ae-paging>';
                    }

                    angular.element(element).html('');

                    var template = angular.element(tplHtml);
                    //var template = angular.element('<md-content>' + tplHtml + '</md-content>');

                    angular.element(element).append($compile(template)(scope));
                });

                scope.$watchCollection('options.lists', function (new_lists) {
                    angular.extend(scope.actualOptions.lists, new_lists);
                });

                // *************************************************************
                // GET LIST, SEARCH, PAGINATION AND SORTING
                // *************************************************************

                scope.getList = function () {
                    angular.extend(scope.ajaxList.params, scope.actualOptions.params);
                    scope.ajaxList.getData({is_exclude_params: !scope.actualOptions.ajax_handler}).$promise.then(function (list) {
                        scope.ngModel = list;
                        scope.filtredList = scope.ngModel;
                    });
                };

                // *************************************************************
                // CLIENT SEARCH
                // *************************************************************

                scope.search = function (newQuery, oldQuery) {
                    scope.filtredList = scope.ngModel;

                    if (newQuery == oldQuery && scope.actualOptions.ajax_handler)
                        return;

                    if (scope.actualOptions.ajax_handler) {
                        scope.getList();
                        return;
                    }

                    if (scope.searchQuery)
                        scope.filtredList = $filter('filter')(scope.ngModel, scope.searchQuery);

                    if (scope.actualOptions.order_by)
                        scope.filtredList = $filter('orderBy')(scope.filtredList, scope.actualOptions.order_by);
                };

                scope.$watch('ajaxList.search', scope.search);

                // *************************************************************
                // EDIT
                // *************************************************************

                scope.editItem = function (item) {
                    if (!item.is_edit) {
                        item.is_edit = true;
                    } else {
                        item.is_edit = false;

                        //TODO: make this work for local
                        if(mode != 'remote')
                            return;

                        scope.actualOptions.resource.get(item, function (response) {
                            angular.extend(item, response);
                        });
                    }
                };

                // *************************************************************
                // CREATE OR UPDATE
                // *************************************************************

                scope.save = function (item) {
                    if (!item)
                        return;

                    item.errors || (item.errors = {});

                    // validation - check required fields and password
                    scope.actualOptions.fields.forEach(function (field) {
                        //if field empty and required - add to errors, else delete from errors
                        if (field.required && !item[field.name])
                            item.errors[field.name] = true;
                        else if (item.errors[field.name])
                            delete item.errors[field.name];

                        //if password not changed and not new object
                        if (field.type == 'password' && item.id)
                            delete item.errors[field.name];

                        //if password not changed delete field from request data
                        if (field.type == 'password' && !item[field.name])
                            delete item[field.name];
                    });

                    // if there some errors
                    if (!AEditHelpers.isEmptyObject(item.errors))
                        return;

                    // actions after save
                    function saveCallbacks(item) {
                        if (scope.onSave)
                            $timeout(scope.onSave);

                        if (scope.actualOptions.callbacks.onSave)
                            $timeout(scope.actualOptions.callbacks.onSave);

                        if (scope.ngChange)
                            $timeout(scope.ngChange);

                        if (scope.actualOptions.callbacks.onChange)
                            $timeout(scope.actualOptions.callbacks.onChange);

                        scope.search();

                        item.is_edit = false;

                        scope.status = item.name + " saved!";
                        $timeout(function () {
                            scope.status = "";
                        }, 1000);

                        if (mode != 'remote') {
                            delete item.is_new;
                            delete item.is_edit;
                            delete item.errors;
                        }
                    }

                    // local json mode
                    if (mode != 'remote') {
                        if (item.is_new) {
                            var track_by = scope.actualOptions.track_by;

                            item[track_by] = 1;
                            scope.ngModel.forEach(function (local_item) {
                                if (local_item[track_by] >= item[track_by])
                                    item[track_by] = local_item[track_by] + 1;
                            });

                            item.json_id = item[track_by];

                            scope.ngModel.unshift(item);
                            scope.new_item = angular.copy(new_item);
                        }

                        saveCallbacks(item);

                        return;
                    }

                    var request_object = angular.copy(item);

                    // check for files from file uploader
                    var uploaders = Object.keys(request_object).filter(function (k) {
                        return ~k.indexOf("__uploader")
                    });
                    // if exists - upload each file and set to *field*_ids array database object of file
                    // TODO: realize mode for take paths of files(not ids of database rows with paths)
                    if (uploaders.length) {

                        uploaders.forEach(function (key) {

                            function sendAll() {
                                var prop_name = key.replace('__uploader', '');
                                if (!request_object[prop_name]) {
                                    sendItem();
                                    return;
                                }

                                request_object[prop_name.substring(0, prop_name.length - 1) + '_ids'] = request_object[prop_name].map(function (obj) {
                                    return obj.id;
                                });
                                delete request_object[key];
                                delete request_object[prop_name];
                                sendItem();
                            }

                            if (!request_object[key].queue.length) {
                                sendAll();
                            } else {
                                request_object[key].onSuccessItem = function () {
                                    if (!request_object[key].queue.length) {
                                        sendAll();
                                    }
                                };
                            }
                        });
                    } else {
                        sendItem();
                    }

                    function sendItem() {
                        var resource = null;

                        if ('id' in request_object && request_object.id) {
                            resource = new scope.actualOptions.resource(request_object);
                            // update if id field exist
                            AEditHelpers.getResourceQuery(resource, 'update').then(function (updated_item) {
                                angular.extend(item, updated_item);

                                saveCallbacks(item);
                            }, errorHandle);
                        } else {
                            //create if id not exist
                            angular.forEach(scope.actualOptions.default_attrs, function (value, attr) {
                                request_object[attr] = value;
                            });

                            resource = new scope.actualOptions.resource(angular.extend(request_object, scope.actualOptions.params));
                            AEditHelpers.getResourceQuery(resource, 'create').then(function (created_item) {
                                created_item.is_new = true;
                                //scope.ngModel.unshift(created_item);
                                scope.getList();
                                delete scope.new_item;
                                scope.new_item = angular.copy(new_item);

                                saveCallbacks(item);
                            }, errorHandle);
                        }
                    }
                };

                // *************************************************************
                // DELETE
                // *************************************************************

                scope.deleteConfirm = function (item) {
                    var index = scope.ngModel.indexOf(item);

                    function deleteCallbacks() {
                        if (mode == 'remote')
                            scope.getList();
                        else
                            scope.ngModel.splice(index, 1);

                        if (scope.ngChange)
                            $timeout(scope.ngChange);

                        if (scope.onDelete)
                            $timeout(scope.onDelete);

                        if (scope.actualOptions.callbacks.onChange)
                            $timeout(scope.actualOptions.callbacks.onChange);

                        if (scope.actualOptions.callbacks.onDelete)
                            $timeout(scope.actualOptions.callbacks.onDelete);
                    }

                    if (mode != 'remote') {
                        deleteCallbacks();
                        return;
                    }

                    if (confirm(AEditConfig.locale.delete_confirm + ' "' + (item.name || item.key || item.title || item.value) + '"?')) {
                        AEditHelpers.getResourceQuery(new scope.actualOptions.resource(item), 'delete').then(function () {
                            deleteCallbacks();
                        }, errorHandle);
                    }
                };

                function errorHandle(){
                    if (scope.onError)
                        $timeout(scope.onError);

                    if (scope.actualOptions.callbacks.onError)
                        $timeout(scope.actualOptions.callbacks.onError);
                }

                scope.drop = function (dropped_index, dropped_item) {
                    var previousIndex = null;
                    scope.ngModel.some(function (item, index) {
                        var result = item.json_id == dropped_item.json_id;
                        if (result)
                            previousIndex = index;
                        return result;
                    });

                    if (previousIndex === null)
                        return;

                    scope.ngModel.splice(previousIndex, 1);

                    if (previousIndex > dropped_index)
                        scope.ngModel.splice(dropped_index, 0, dropped_item);
                    else
                        scope.ngModel.splice(dropped_index - 1, 0, dropped_item);

                    scope.ngModel.forEach(function (item, index) {
                        item.index = index;
                    });

                    if (scope.ngChange)
                        $timeout(scope.ngChange);

                    scope.search();
                };

                // *************************************************************
                // WATCHERS
                // *************************************************************

                scope.$watchCollection('ngModel', function (list) {
                    if (!list)
                        return;

                    if (mode == 'local') {
                        var track_by = scope.actualOptions.track_by;
                        list.forEach(function (item, index) {
                            if (!item[track_by] || item[track_by] == 0) {
                                item[track_by] = list.length + index + 1;
                            }
                            if (!item.json_id)
                                item.json_id = item[track_by];
                        })
                    }

                    scope.search();
                    scope.actualOptions.lists['self'] = list;
                });
            }
        }
    }]);
