// Code goes here
angular
  .module('a-edit', ['ngMaterial', 'ngSanitize', 'cl.paging'])
  
  .run(['$templateCache', function($templateCache) {
    
    $templateCache.put('a-edit-image-popover.html', '<img class="fit" ng-src="{{::image}}" alt="">');
    
    $templateCache.put('a-edit-date-input.html', '\
        <div class="date-input">\
            <span ng-if="viewMode">{{ngModelStr}}</span>\
            \
            <div ng-if="!viewMode" class="input-group">\
                <input\
                        type="text"\
                        class="form-control input-sm"\
                        \
                        name="{{$parent.name}}"\
                        ng-model="$parent.ngModel"\
                        placeholder="{{$parent.placeholder}}"\
                        \
                        uib-datepicker-popup="dd.MM.yyyy"\
                        datepicker-options="$parent.options"\
                        ng-init="$parent.ngModel = $parent.ngModel"\
                        is-open="isOpen"\
                        \
                        ng-enter="$parent.save()"\
                        ng-change="$parent.change()"/>\
                \
                <span class="input-group-btn">\
                  <button tabindex="-1" type="button" class="btn btn-sm btn-default" ng-click="isOpen=true"><i class="glyphicon glyphicon-calendar"></i></button>\
                </span>\
            </div>\
        \
        </div>\
    ');

    $templateCache.put('a-edit-bool-input.html', '\
        <div>\
            <md-icon ng-if="viewMode">{{$parent.fakeModel ? "done" : "crop_din"}}</md-icon>\
            <md-checkbox ng-if="!viewMode" ng-model="$parent.fakeModel" ng-change="$parent.change()">{{$parent.label}}</md-checkbox>\
        </div>\
    ');

    $templateCache.put('a-edit-popover-image.html', '\
        <a target="_blank" href="{{::image}}" uib-popover-template="imagePopoverPath" popover-placement="left" popover-trigger="mouseenter">\
            {{:: text || image}}\
        </a>\
    ');

      $templateCache.put('a-edit-paging.html', '\
        <md-content ng-if="ngModel.total_pages > 1">\
            <cl-paging flex cl-pages="ngModel.total_pages" cl-steps="ngModel.per_page" cl-page-changed="pagingChanged()" cl-align="center" cl-current-page="ngModel.current"></cl-paging>\
        </md-content>\
    ');

      $templateCache.put('ae-sorting.html', '\
        <a href ng-click="sort()" ng-class="[\'ae-sort-link\', {\'asc\': ngModel == \'ASC\', \'desc\': ngModel == \'DESC\'}]">\
            <b ng-transclude></b>\
            <button class="md-datepicker-triangle-button md-icon-button md-button" md-no-ink ng-click="sort()">\
                <div class="md-datepicker-expand-triangle ng-scope"></div>\
            </button>\
        </a>\
    ');
  }]);

angular
    .module('a-edit')
    .directive('aeBoolInput', ['$timeout', '$filter', function($timeout, $filter) {
        return {
            restrict: 'E',
            templateUrl: 'a-edit-bool-input.html',
            scope: {
                //require
                ngModel: '=',
                viewMode: '=',
                //callbacks
                ngChange: '&',
                onSave: '&',
                //sub
                name: '@',
                label: '@'
            },
            link: function (scope, element) {

                scope.$watch('ngModel', function(ngModel){
                    scope.fakeModel = ngModel == 1;
                });

                scope.change = function(){
                    scope.ngModel =  scope.fakeModel;

                    if(scope.ngChange)
                        $timeout(scope.ngChange);
                };
            }
        };
    }]);
angular
    .module('a-edit')
    .directive('aeDateInput', ['$timeout', '$filter', function($timeout, $filter) {
        return {
            restrict: 'E',
            templateUrl: 'a-edit-date-input.html',
            scope: {
                //require
                ngModel: '=',
                ngModelStr: '=?',
                ngModelSubStr: '=?',
                viewMode: '=',
                //callbacks
                ngChange: '&',
                onSave: '&',
                //sub
                placeholder: '@',
                name: '@'
            },
            link: function (scope, element) {

                scope.getDayClass = function(obj) {
                    if (obj.mode === 'day') {
                        var day = new Date(obj.date).getDay();
                        if (day == 0 || day == 6)
                            return 'day-off';
                    }
                };

                scope.options = {
                    startingDay: 1,
                    customClass: scope.getDayClass,
                    todayText: '',
                    currentText:'',
                    clearText: '',
                    closeText: 'Close',
                    appendToBody: false
                };

                scope.save = function(){
                    if(scope.onSave)
                        $timeout(scope.onSave);
                };

                scope.change = function(){
                    setStr();

                    if(scope.ngChange)
                        $timeout(scope.ngChange);
                };
                function setStr(){
                    if(scope.ngModel){
                        scope.ngModelStr = $filter('amDateFormat')(scope.ngModel, 'D MMM. YYYY');
                        scope.ngModelSubStr = $filter('amDateFormat')(scope.ngModel, 'DD.MM.YYYY');
                    }
                }

                scope.$watch('ngModel', setStr);
            }
        };
    }]);
angular
    .module('a-edit')

    .directive('aeFileUpload', ['$timeout', '$compile', 'FileUploader', function($timeout, $compile, FileUploader) {

        function getTemplateByType(type){
            var result = '';
            if(type == 'multifile'){
                result +='<ul class="list-unstyled">' +
                    '<li ng-repeat="item in ngModel">';
            }

            result += '<popover-image ng-model="' + (type == 'multifile' ? 'item' : 'ngModel') + '.file" text="' + (type == 'multifile' ? 'item' : 'ngModel') + '.name"></popover-image>';

            if(type == 'multifile'){
                result +=   '</li>' +
                    '</ul>';
            }

            result +=   '<ul ng-if="!viewMode" class="list-unstyled">' +
                '<li ng-repeat="item in uploader.queue">' +
                '<popover-image ng-model="item.file" text="item.file.name"></popover-image>' +
                '<a href ng-click="item.remove()"><span class="glyphicon glyphicon-remove"></span></a>' +
                '</li>' +
                '</ul>' +
                '<span ng-if="!viewMode && uploader" class="btn btn-sm btn-default btn-file">' +
                'Р—Р°РіСЂСѓР·РёС‚СЊ' +
                '<input type="file" nv-file-select uploader="uploader" ' + (type == 'multifile' ? 'multiple': '') + ' />' +
                '</span>';

            return result;
        }

        var typeTemplates = {
            'file': $compile(getTemplateByType('file')),
            'multifile': $compile(getTemplateByType('multifile'))
        };

        return {
            restrict: 'E',
            require: 'ngModel',
            scope: {
                ngModel: '=',
                viewMode: '=?',
                uploader: '=',
                //callbacks
                ngChange: '&',
                onSave: '&',
                //sub
                inputName: '@',
                url: '@',
                type: '@'
            },
            link: function (scope, element, attrs, ngModel) {

                var template = typeTemplates[scope.type || 'file'],
                    templateElement;

                template(scope, function (clonedElement, scope) {
                    templateElement = clonedElement;
                    element.append(templateElement);
                });

                template = null;

                element.on("$destroy", function () {
                    templateElement.remove();
                    templateElement = null;
                });

                function initUploader(){
                    scope.uploader = new FileUploader();
                    scope.uploader.url = scope.url;
                    scope.uploader.alias = scope.inputName;
                    scope.uploader.autoUpload = true;
                    scope.uploader.removeAfterUpload = true;

                    scope.uploader.onAfterAddingFile = function(item){
                        setImageSrc(item);
                    };
                    scope.uploader.onSuccessItem = function(item, response){
                        if(!scope.ngModel)
                            scope.ngModel = [];

                        scope.ngModel.push(response);
                        console.log(scope.ngModel);
                    };
                }

                if(!scope.viewMode)
                    initUploader();

                function setImageSrc (item){
                    var reader = new FileReader();

                    reader.onload = (function(theFile) {
                        return function(e) {
                            item.image_src = e.target.result;
                            scope.$apply();
                        };
                    })(item._file);

                    reader.readAsDataURL(item._file);
                }

                scope.save = function(){
                    if(scope.onSave)
                        $timeout(scope.onSave);
                };

                scope.$watch('ngModel', function(newVal){
                    if(!newVal && !scope.viewMode)
                        initUploader();
                });
                scope.$watch('viewMode', function(newVal){
                    if(!newVal)
                        initUploader();
                })
            }
        };
    }]);

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
                        scope.ajaxList.paging.current = 1;
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

angular
    .module('a-edit')

    .directive('aeObjectModal', ['$timeout', '$log', '$cacheFactory', 'AEditHelpers', 'AEditConfig', '$mdDialog', function($timeout, $log, $cacheFactory, AEditHelpers, AEditConfig, $mdDialog) {
        var cache = $cacheFactory('aModal.Templates');

        return {
            restrict: 'A',
            scope: {
                //require
                aeObjectModal: '=',
                modalResourceOptions: '=?',
                viewMode: '=?',
                //callbacks
                onSave: '&'
            },
            link: function (scope, element, attrs) {

                var resource_name = attrs.aeObjectModal + new Date().getTime();
                scope.options = scope.modalResourceOptions || AEditConfig.current_options;

                element.on("click", function () {
                    // var template = cache.get(resource_name) || '';
                    // //'<button ng-click="cancel()" class="close pull-right"><span>&times;</span></button>' +
                    // if(!template){

                    var data = {
                        object: angular.copy(scope.aeObjectModal),
                        resource: scope.options.resource,
                        lists: scope.options.lists,
                        viewMode: scope.viewMode
                    };

                    var template = '';

                        template +=
                            '<md-dialog class="ae-object-modal">' +
                                '<md-toolbar>' +
                                    '<div class="md-toolbar-tools">' +
                                        '<h3>' + AEditConfig.locale.modal + '</h3>' +

                                        '<span flex></span>' +

                                        '<md-button class="md-icon-button" ng-click="object.is_edit = !object.is_edit">' +
                                            '<md-icon>mode_edit</md-icon>' +
                                        '</md-button>' +
                                    '</div>' +
                                '</md-toolbar>' +
                                '<md-dialog-content class="padding">';
                        
                        scope.options.fields.forEach(function(field){
                            template += '<md-content flex="grow" layout>';

                            template += '<div layout="column" layout-align="center" flex="30" style="text-align: right" class="padding"><label>' + field.label + '</label></div>';
                            template += '<div layout="column" layout-align="center" flex="70" class="padding">' + AEditHelpers.generateDirectiveByConfig(field, {
                                item_name: 'object',
                                lists_container: 'lists',
                                already_modal: true,
                                no_label: true
                            }) + '</div>';

                            template += '</md-content>';

                            data[field.name + '_resource'] = field.resource;
                        });
                        
                        template +=
                                '</md-dialog-content>' +
                                '<md-dialog-actions>' +
                                    '<md-button ng-click="ok()" class="md-primary">OK</md-button>' +
                                '</md-dialog-actions>' +
                            '</md-dialog>';
                            
                    //     cache.put(resource_name, template);
                    // }

                    var modalInstance = $mdDialog.show({
                        clickOutsideToClose: true,
                        template: template,
                        locals: {
                            data: data
                        },
                        controller: ['$scope', '$mdDialog', 'data', function($scope, $mdDialog, data) {
                            angular.extend($scope, data);

                            AEditHelpers.getResourceQuery(new scope.options.resource($scope.object), 'show').then(function(object){
                                $scope.object = object;
                                $scope.object.is_edit = data.viewMode;
                            });
                            
                            $scope.ok = function () {
                                $scope.object.is_edit = false;
                                $mdDialog.hide($scope.object);
                            };
                            $scope.cancel = function () {
                                $mdDialog.cancel();
                            };
                        }]
                    });

                    modalInstance.then(function (object) {
                        angular.extend(scope.aeObjectModal, object);
                        
                        if(scope.onSave)
                            $timeout(scope.onSave);
                    }, function () {
                        $log.info('Modal dismissed at: ' + new Date());
                    });
                });

                scope.save = function(){
                    if(scope.onSave)
                        $timeout(scope.onSave);
                }
            }
        };
    }]);

angular
    .module('a-edit')
    .directive('aePaging', ['$timeout', function($timeout) {
        return {
            restrict: 'E',
            templateUrl: 'a-edit-paging.html',
            scope: {
                ngModel: '=',
                ngChange: '&',
                totalItems: '='
            },
            link: function (scope, element) {
                scope.$watch('ngModel.total_items', onConfigChange);
                scope.$watch('ngModel.per_page', onConfigChange);
                function onConfigChange(){
                    scope.ngModel.total_pages = Math.ceil(parseInt(scope.ngModel.total_items) / scope.ngModel.per_page);
                }
                var isFirstChange = true;
                scope.pagingChanged = function(){
                    if(isFirstChange){
                        isFirstChange = false;
                        return;
                    }
                    console.log('pagingChanged');
                    $timeout(scope.ngChange);
                }
            }
        };
    }]);
angular
    .module('a-edit')
    .directive('aeSelectInput', ['$timeout', '$filter', '$compile', '$templateCache', '$mdDialog', 'AEditHelpers' ,'AEditConfig', '$q', function($timeout, $filter, $compile, $templateCache, $mdDialog, AEditHelpers, AEditConfig, $q) {
        function getTemplateByType(type, options){
            options = options || {};

            var mdSelect = {
                //attributes: '',
                //match: 'selectedName',
                //itemId: 'item.id',
                itemName: 'getNameFromObj(item)',
                //subClasses: ''
            };

            var template = '<label ng-if="!viewMode">{{label}}</label>';
            if(type == 'select' || type == 'textselect') {
                template += '<span ng-if="viewMode">{{getNameFromObj(options.selected)}}</span>';
            }

            if(type == 'multiselect') {
                template += '' +
                    '<md-chips ng-model="options.selected" md-on-remove="removeFromMultiSelect($chip)">' +
                        '<md-chip-template ng-dblclick="editItem(objectsById[$chip])">' +
                            '<span>{{getNameFromObj(objectsById[$chip])}}</span>' +
                        '</md-chip-template>';
            }

            template +=
                        '<md-autocomplete ' +
                            (type == 'select' || type == 'textselect' ? ' md-selected-item="$parent.options.selected" ' : ' ') +
                            'ng-if="!viewMode"' +
                            'id="{{id}}" ' +
                            'md-input-name="{{name}}" ' +
                            'ng-required="{{ngRequired}}" ' +
                            'md-require-match="ngRequired" ' +
                            'md-clear-button="!disallowClear" ' +
                            'md-search-text="options.search" ' +
                            'md-items="item in getListByResource()" ' + // | filter:options.search"
                            'md-no-cache="true" ' +
                            'ng-disabled="ngDisabled" ' +
                            'md-search-text-change="debouncedGetList()" ' +
                            'md-selected-item-change="selectedItemChange(item)" ' +
                            'md-item-text="' + mdSelect.itemName + '" ' +
                            'md-min-length="autoCompleteMinLength" ' +
                            'placeholder="{{placeholder}}"' +
                            '> ' +
                                '<md-item-template> ' +
                                    '<span md-highlight-text="options.search" md-highlight-flags="^i">{{' + mdSelect.itemName + '}}</span> ' +
                                '</md-item-template>' +
                                '<md-not-found>' +
                                    AEditConfig.locale.not_found + ' <a href ng-click="editItem(null)" ng-show="adder">' + AEditConfig.locale.create_new_question + '</a>' +
                                '</md-not-found>' +
                        '</md-autocomplete>';


            if(type == 'multiselect') {
                template += '' +
                    '</md-chips>';
            }

            return template;
        }

        var typeTemplates = {
            'select': $compile(getTemplateByType('select')),
            'textselect': $compile(getTemplateByType('textselect')),
            'multiselect': $compile(getTemplateByType('multiselect'))
        };

        return {
            restrict: 'E',
            require: 'ngModel',
            scope: {
                //require
                list: '=?',
                ngModel: '=',
                params: '=?',
                ngModelStr: '=?',
                viewMode: '=?',
                hasError: '=?',
                disallowClear: '=?',
                ngRequired: '=?',
                ngDisabled: '=?',

                ngResource: '=?',
                ngResourceFields: '=?',

                refreshListOn: '=?',

                //callbacks
                ngChange: '&',
                onSave: '&',
                onSelect: '&',
                onRemove: '&',
                //sub
                adder: '=?',
                getList: '=?',
                idAsName: '=?',
                nameField: '@',
                orNameField: '@',
                placeholder: '@',
                defaultValue: '@',
                label: '@',
                name: '@',
                type: '@' //select or multiselect
            },
            link: function (scope, element, attrs, ngModel) {
                scope.id = 'ae-edit-select-xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {var r = Math.random()*16|0,v=c=='x'?r:r&0x3|0x8;return v.toString(16);});
                //=============================================================
                // Config
                //=============================================================
                var variables = angular.extend({}, AEditConfig.grid_options.request_variables, AEditConfig.grid_options.response_variables);

                scope.autoCompleteMinLength = 0;
                scope.refreshDelay = AEditConfig.select_options.refresh_delay;
                scope.resetSearchInput = AEditConfig.select_options.reset_search_input;

                scope.options = {
                    selected: scope.type == 'multiselect' ? [] : null,
                    search: ''
                };

                scope.full_type = scope.type = scope.type || 'select';
                if(scope.adder)
                    scope.full_type += '-adder';

                if(attrs.defaultValue)
                    scope.ngModel = scope.defaultValue;

                scope.fakeModel = scope.ngModel;

                //=============================================================
                // Compile
                //=============================================================

                typeTemplates[scope.type](scope, function (clonedElement, scope) {
                    element.empty();
                    element.append(clonedElement);
                });

                //=============================================================
                // Output validation
                //=============================================================
                //scope.$watch('hasError', function(hasError){
                //    scope.input_class = hasError ? "has-error" : '';
                //});

                //=============================================================
                // Callbacks
                //=============================================================
                scope.selectedItemChange = function(obj){

                    if(scope.type == 'select')  {
                        scope.fakeModel = scope.options.selected ?  scope.options.selected.id || scope.options.selected.value : null;
                    } else if(scope.type == 'multiselect'){
                        if(!obj)
                            return;
                        scope.options.selected = scope.options.selected ?  scope.options.selected.filter(function(obj){return !angular.isObject(obj);}) : [];
                        scope.fakeModel = scope.options.selected;

                        scope.options.selected.push(obj.id);
                        if(!scope.objectsById)
                            scope.objectsById = {};
                        scope.objectsById[obj.id] = obj;
                        scope.options.search = '';
                    } else if(scope.type == 'textselect'){
                        scope.fakeModel = scope.options.selected;
                    }

                    scope.ngModel = scope.fakeModel;

                    //scope.options.search = '';

                    getList();

                    $timeout(function () {
                        if(scope.onSelect){
                            if(angular.isObject(obj))
                                scope.onSelect({item: obj.id});
                            else
                                scope.onSelect({item: obj});
                        }
                    });

                    $timeout(scope.ngChange);
                };

                scope.removeFromMultiSelect = function(item){
                    $timeout(scope.ngChange);
                    $timeout(function () {
                        if (scope.onRemove)
                            scope.onRemove({item: item});
                    });

                    if(scope.ngModel.includes(item))
                        scope.ngModel.splice(scope.ngModel.indexOf(item), 1);
                    scope.fakeModel = scope.ngModel;
                    scope.setSelected();
                };

                scope.$watch('ngModel', function(newVal){
                    if(scope.fakeModel == newVal)
                        return;

                    if(Array.isArray(scope.fakeModel) && Array.isArray(newVal)){
                        if(scope.fakeModel.length == newVal.length
                            && scope.fakeModel.every(function(v,i) { return v === newVal[i]}))
                            return
                    }

                    if(!newVal)
                        scope.options.search = '';

                    scope.fakeModel = newVal;

                    if(scope.type == 'multiselect' && angular.isObject(scope.fakeModel)){
                        var fixedFakeModel = [];
                        angular.forEach(scope.fakeModel, function(value){
                            fixedFakeModel.push(value);
                        });
                        scope.fakeModel = fixedFakeModel;
                        scope.ngModel = fixedFakeModel;
                    }

                    scope.options.selected = null;
                    scope.setSelected();
                });

                //=============================================================
                // Init select list
                //=============================================================
                var last_resource = scope.ngResource;
                function initListGetByResource(){
                    if(!scope.ngResource || !scope.getList || (scope.local_list && scope.local_list.length)){
                        if(last_resource == scope.ngResource){
                            return;
                        }
                    }

                    if(last_resource != scope.ngResource){
                        scope.options.selected = null;
                        scope.objectsById = null;
                    }

                    getList();

                    last_resource = scope.ngResource;
                }

                function getList(resolve, reject){
                    if(!scope.ngResource){
                        if(!scope.local_list)
                            scope.local_list = [];

                        var filtred = $filter('filter')(scope.local_list, scope.options.search);

                        filtred = filtred.filter(function (item) {
                            if(scope.type == 'multiselect' && scope.ngModel && scope.ngModel.length)
                                return scope.ngModel.indexOf(item.id) == -1;
                            else if(scope.type == 'select')
                                return scope.ngModel != (item.id || item.value);
                            else
                                return true;
                        });

                        if(angular.isFunction(resolve))
                            resolve(filtred);

                        return filtred;
                    }

                    var request_options = angular.extend({}, scope.params || {});
                    if(scope.options.search)
                        request_options[variables['query']] = scope.options.search;
                    else
                        delete request_options[variables['query']];

                    request_options[variables['limit']] = AEditConfig.select_options.items_per_page;

                    if(scope.type == 'multiselect' && scope.objectsById)
                        request_options[variables['id_not_in']] = scope.ngModel && scope.ngModel.length ? scope.ngModel.join(',') : [];

                    return AEditHelpers.getResourceQuery(scope.ngResource, 'get', request_options).then(function(list){
                        //var isResourceWasReinit = scope.ngModel && scope.ngModel.length && !scope.objectsById
                        scope.local_list = list;

                        if(scope.fakeModel)
                            scope.setSelected();

                        if(scope.type == 'multiselect' && scope.ngModel && scope.ngModel.length){
                            scope.local_list = list.filter(function(item){
                                return !scope.ngModel.includes(item.id);
                            });
                        }

                        if(angular.isFunction(resolve))
                            resolve(scope.local_list);
                    }, function(response){
                        if(angular.isFunction(reject))
                            reject(response);
                    });
                }

                scope.debouncedGetList = AEditHelpers.debounce(getList, 300);
                scope.getListByResource = function (){
                    return $q(scope.debouncedGetList);
                };

                var debouncedInitList = AEditHelpers.debounce(initListGetByResource, 300);

                scope.$watch('ngResource', debouncedInitList);
                scope.$watch('refreshListOn', debouncedInitList);
                scope.$watchCollection('params', getList);

                //=============================================================
                // Output non edit mode
                //=============================================================
                scope.$watch('list', function(list){
                    scope.local_list = angular.copy(list);
                    scope.setSelected();
                });

                scope.setSelected = function(){
                    if((!scope.local_list || !scope.local_list.length) && !scope.idAsName)
                        return;

                    if(scope.type == 'textselect'){
                        scope.options.selected = scope.ngModel ? scope.ngModel : '';
                        return;
                    }

                    if(scope.type == 'multiselect'){
                        if(!scope.objectsById)
                            scope.objectsById = {};
                        if(!scope.ngModel || !scope.ngModel.length){
                            scope.options.selected = [];
                            return;
                        }
                        else if(scope.options.selected && scope.options.selected.length && scope.fakeModel.length == scope.options.selected.length)
                            return;

                        scope.options.selected = angular.copy(scope.ngModel);

                        scope.ngModel.forEach(function(id, index){
                            if(scope.objectsById[id])
                                return;

                            if(scope.idAsName){
                                scope.objectsById[id] = {
                                    id: id,
                                    name: id
                                };
                                return;
                            }

                            var foundItem = null;
                            scope.local_list.some(function(item){
                                if(item.id == id)
                                    foundItem = item;

                                return item.id == id;
                            });

                            if(foundItem){
                                scope.objectsById[foundItem.id] = foundItem;
                            } else {
                                getObjectFromServer(id).then(function(serverItem){
                                    if(serverItem)
                                        scope.objectsById[serverItem.id] = serverItem;
                                })
                            }
                        });
                    } else if(scope.type == 'select')  {
                        if(!scope.ngModel){
                            scope.options.selected = null;
                            if(scope.options.search)
                                return;

                            closeSelectList();
                            return;
                        } else if(scope.options.selected){
                            return;
                        }

                        var found = scope.local_list.some(function(item){
                            if(item.id == scope.ngModel || item.value == scope.ngModel)
                                scope.options.selected = item;

                            return item.id == scope.ngModel;
                        });
                        if(!found && scope.ngResource){
                            getObjectFromServer(scope.ngModel).then(function(serverItem){
                                scope.options.selected = serverItem;
                            })
                        }
                    }
                };

                function getObjectFromServer(id){
                    return AEditHelpers.getResourceQuery(scope.ngResource, 'show', {id: id});
                }

                function closeSelectList(){
                    scope.autoCompleteMinLength = 1;
                    scope.options.search = '';
                    $timeout(function () {
                        scope.autoCompleteMinLength = 0;
                        angular.element(element).find('input').blur();
                    }, 500);
                }

                scope.getNameFromObj = function(obj){
                    if(!obj)
                        return '';

                    if(scope.type == 'textselect' || angular.isString(obj))
                        return obj;

                    function getFieldByName(nameField){
                        var objProp = angular.copy(obj);
                        nameField.split('.').forEach(function(partOfName){
                            if(objProp)
                                objProp = objProp[partOfName];
                        });
                        return objProp || '';
                    }

                    if(!scope.nameField || (scope.nameField.indexOf('.') == -1 && scope.nameField.indexOf('+') == -1))
                        return obj[scope.nameField] || obj.name || obj[scope.orNameField];
                    else {
                        if(scope.nameField.indexOf('+') != -1){
                            var result = '';
                            scope.nameField.split('+').forEach(function(fieldname, index){
                                var fieldValue = getFieldByName(fieldname);
                                if(!fieldValue)
                                    return;

                                if(index > 0)
                                    result += ' (';

                                result += fieldValue;

                                if(index > 0)
                                    result += ')';
                            });
                            return result;
                        } else {
                            return getFieldByName(scope.nameField);
                        }
                    }
                };

                scope.editItem = function(item){
                    if(scope.type == 'textselect' || !scope.ngResourceFields || !scope.ngResourceFields.length)
                        scope.ngResourceFields = [{name: scope.nameField || 'name' || scope.orNameField, label: ''}];

                    var inputsHtml = '';
                    var data = { lists: {}, configs: {}, object: item || {}, fields: scope.ngResourceFields };

                    scope.ngResourceFields.forEach(function(field){
                        if(!item || !item.id){
                            if(field.name == scope.nameField || field.name == 'name' || field.name == scope.orNameField){
                                data.object[field.name] = scope.options.search;
                                //field.default_value = scope.options.search;
                            }
                        }

                        inputsHtml += '<div class="ae-select-input-dialog-field" flex="grow" layout="row" layout-fill>' + AEditHelpers.generateDirectiveByConfig(field, {
                                            item_name: 'object',
                                            lists_container: 'lists',
                                            always_edit: true,
                                            get_list: true,
                                            is_new: true,
                                            list_variable: 'lists.' + field.name + '_list',
                                            config_variable: 'configs.' + field.name + '_config',
                                            input_name: field.name
                                            //already_modal: true
                                        }, data.object) + '</div>';

                        data.lists[field.name + '_list'] = angular.isArray(field.list) ? field.list : [];
                        data.configs[field.name + '_config'] = angular.isObject(field.config) ? field.config : {};

                        if(field.resource){
                            data[field.name + '_resource'] = field.resource;
                        }

                        if(field.type == 'multiselect'){
                            data.object[field.name] = [];
                        }
                    });

                    closeSelectList();

                    // var position = $mdPanel.newPanelPosition()
                    //     .relativeTo('#' + scope.id)
                    //     .addPanelPosition($mdPanel.xPosition.ALIGN_START, $mdPanel.yPosition.BELOW);

                    $mdDialog.show({
                        clickOutsideToClose: false,
                        focusOnOpen: true,
                        hasBackdrop: true,
                        panelClass: 'md-background md-hue-3',
                        locals: {
                            data: data
                        },
                        controller: ['$scope', '$mdDialog', 'data', function ($scope, $mdDialog, data) {
                            angular.extend($scope, data);

                            $scope.isDisabled = function(){
                                return scope.ngResourceFields.some(function(field){
                                    return field.required && !$scope.object[field.name];
                                });
                            };

                            $scope.save = function() {
                                $scope.form.$setSubmitted();

                                if(!$scope.form.$valid)
                                    return;

                                $mdDialog.hide($scope.object);
                            };
                            $scope.cancel = function() {
                                $mdDialog.cancel();
                            };
                        }],
                        template: '' +
                        '<md-dialog>' +
                            '<md-toolbar class="md-primary"><div class="md-toolbar-tools"><h4>' + AEditConfig.locale.create_new + '</h4><span class="flex"></span><md-button class="md-icon-button" ng-click="cancel()"><md-icon>close</md-icon></md-button></div></md-toolbar>' +
                            '<md-dialog-content layout="row" class="padding padding-top" layout-wrap>' +
                                '<form name="form" layout="column" flex="grow">' +
                                    '<md-content layout="row" layout-wrap>' +
                                        inputsHtml +
                                    '</md-content>' +
                                '</form>' +
                            '</md-dialog-content>' +
                            '<md-dialog-actions>' +
                                '<md-button ng-click="save()" ng-disabled="isDisabled()">' + AEditConfig.locale.save + '</md-button>' +
                                '<md-button ng-click="cancel()">' + AEditConfig.locale.cancel + '</md-button>' +
                            '</md-dialog-actions>' +
                        '</md-dialog>'
                    }).then(function(savedItem){
                        saveToList(item, savedItem)
                    });
                };

                //=============================================================
                // Add new item to select list by adder
                //=============================================================
                function saveToList (editedItem, savedItem){
                    if(scope.type == 'textselect'){
                        //get first property of object and add it to list
                        var is_first_prop = true;
                        angular.forEach(savedItem, function(prop_value){
                            if(is_first_prop){
                                scope.local_list.unshift(prop_value);
                                scope.ngModel = prop_value;
                            }
                            is_first_prop = false;
                        });
                        return;
                    }

                    AEditHelpers.getResourceQuery(new scope.ngResource(angular.extend(editedItem || {}, savedItem, scope.params || {})), editedItem ? 'update' : 'create').then(function(object){
                        scope.options.search = '';

                        if(scope.type == 'multiselect'){
                            if(scope.fakeModel.includes(object.id))
                                scope.objectsById[object.id] = object;
                            else
                                scope.fakeModel.push(object.id);
                        } else if(scope.type == 'select'){
                            scope.fakeModel = object.id;
                        }

                        scope.ngModel = scope.fakeModel;

                        scope.setSelected();

                        $timeout(scope.onSelect);
                        $timeout(scope.ngChange);
                    });
                }
            }
        };
    }]);
angular
    .module('a-edit')
    .directive('aeSorting', ['$timeout', function($timeout) {
        return {
            restrict: 'E',
            templateUrl: 'ae-sorting.html',
            transclude: true,
            scope: {
                ngModel: '=',
                name: '@',
                ngChange: '&'
            },
            link: function (scope, element, attrs) {
                scope.sort = function(){
                    if(!scope.ngModel){
                        scope.ngModel = 'ASC';
                    } else if(scope.ngModel == 'ASC'){
                        scope.ngModel = 'DESC';
                    } else if(scope.ngModel == 'DESC'){
                        scope.ngModel = '';
                    }

                    $timeout(scope.ngChange);
                }
            }
        };
    }]);
angular
    .module('a-edit')
    .directive('aeTextInput', ['$timeout', '$compile', function($timeout, $compile) {
        function getTemplateByType(type, options){
            var text = '{{$parent.ngModel}}';
            var inputTagBegin = '<input type="text" ';
            var inputTagEnd = '';

            if(options && options.modal_link)
                text = '<a ae-object-modal="modalObject" modal-resource-options="modalOptions" on-save="save()" href>' + text + '</a>';
            else if(type == 'textarea'){
                text = '<pre ng-if="$parent.ngModel">{{$parent.ngModel}}</pre>';

                inputTagBegin = '<textarea ';
                inputTagEnd = '</textarea>';
            } else if(type == 'password'){
                text = '<small>[password hidden]</small>';

                inputTagBegin = '' +
                    '<a href ng-click="changePassword = true" ng-show="!isNew && !changePassword">Change password</a>' +
                    '<div ng-show="changePassword || isNew"><input type="password" ';
                inputTagEnd = '</div>';
            }

            inputTagBegin += 'ng-change="ngChange()" ';

            inputTagBegin = '<md-input-container flex="grow"><label>{{$parent.label}}</label>' + inputTagBegin;
            inputTagEnd += '</md-input-container>';

            return '' +
                '<div ng-if="viewMode">' +
                text +
                '</div>' +
                '<div ng-if="!viewMode" ng-class="input_class" layout>' +
                inputTagBegin +
                ' placeholder="{{$parent.placeholder}}" ' +
                ' name="{{$parent.name}}" ' +
                ' ng-required="$parent.ngRequired" ' +
                ' ng-model="$parent.ngModel" ' + (type != 'textarea' ? 'ng-enter="$parent.save()"' : '') +
                ' ng-model-options="$parent.ngModelOptions || {}"' +
                ' ng-style="{ \'width\' : $parent.width + \'px\'}"' +
                ' ng-disabled="$parent.ngDisabled == 1" >' +
                inputTagEnd +
                '</div>';
        }

        var typeTemplates = {
            'text': $compile(getTemplateByType('text')),
            'password': $compile(getTemplateByType('password')),
            'text_modal_link': $compile(getTemplateByType('text', {modal_link: true})),
            'textarea': $compile(getTemplateByType('textarea'))
        };

        return {
            restrict: 'E',
            scope: {
                //require
                ngModel: '=',
                ngModelOptions: '=?',
                ngModelStr: '=?',
                isNew: '=?',
                viewMode: '=?',
                modalObject: '=?',
                modalOptions: '=?',
                hasError: '=?',
                ngDisabled: '=?',
                ngRequired: '=?',
                defaultValue: '@',
                //callbacks
                ngChange: '&',
                onSave: '&',
                //sub
                label: '@',
                placeholder: '@',
                name: '@',
                width: '@',
                type: '@' //text or textarea
            },
            link: function (scope, element, attrs) {
                scope.type = scope.type || 'text';
                if(attrs.modalObject && scope.type == 'text')
                    scope.type = "text_modal_link";

                var template = typeTemplates[scope.type],
                    templateElement;

                template(scope, function (clonedElement, scope) {
                    templateElement = clonedElement;
                    element.append(templateElement);
                });

                template = null;

                element.on("$destroy", function () {
                    templateElement.remove();
                    templateElement = null;
                });

                scope.$watch('hasError', function(hasError){
                    scope.input_class = hasError ? "has-error" : '';
                });

                function setDefaultValue(){
                    if(!scope.ngModel && scope.defaultValue)
                        scope.ngModel = scope.defaultValue;
                }
                setDefaultValue();
                //scope.$watch('ngModel', setDefaultValue);
                //scope.$watch('defaultValue', setDefaultValue);

                scope.save = function(){
                    if(scope.required && !scope.ngModel){
                        scope.input_class = "has-error";
                        return;
                    }

                    scope.input_class = '';
                    if(scope.onSave)
                        $timeout(scope.onSave);
                }
            }
        };
    }]);

angular
    .module('a-edit')
    .directive('iconButton', ['$timeout', function($timeout) {
        return {
            restrict: 'E',
            template: '<button type="button" class="btn btn-{{type}} btn-{{size || \'xs\'}}" ng-click="click()">' +
            '<span class="glyphicon glyphicon-{{glyphicon}}" aria-hidden="true"></span>' +
            '</button>',
            scope: {
                type: '@',
                size: '@',
                glyphicon: '@'
            },
            link: function (scope, element) {

            }
        };
    }]);

angular
    .module('a-edit')

    .directive('ngEnter', function() {
        return function(scope, element, attrs) {
            element.bind("keydown keypress", function(event) {
                if(event.which === 13) {
                    scope.$apply(function(){
                        scope.$eval(attrs.ngEnter);
                    });

                    event.preventDefault();
                }
            });
        };
    });
angular
    .module('a-edit')
    .directive('popoverImage', ['$timeout', '$filter', function($timeout, $filter) {
        return {
            restrict: 'E',
            templateUrl: 'a-edit-popover-image.html',
            scope: {
                //require
                ngModel: '=',
                text: '=?'
            },
            link: function (scope, element) {
                scope.text = scope.text || scope.ngModel.name;
                scope.image = scope.ngModel.image_src || scope.ngModel.file || scope.ngModel;

                scope.imagePopoverPath = 'a-edit-image-popover.html';
            }
        };
    }]);

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

            self.manualSorting = false;

            self.getData = function(options, callback){
                if(options){
                    if(options.is_add_next_page)
                        self.paging.current++;
                    if(options.is_search_changed)
                        self.paging.current = 1;
                }

                var temp_params = angular.copy(self.params);
                if(options && options.temp_params)
                    angular.extend(temp_params, options.temp_params);

                self.prepareQuery(temp_params);

                var params = options && options.is_exclude_params ? {} : self.temp_params;
                if(options && options.exclude_params){
                    options.exclude_params.forEach(function(param){
                        delete params[param];
                    })
                }

                var result = self.resource.query(params, function(data, headers){
                    self.paging.total_items = headers('Meta-Filter-Count');
                    if(callback)
                        callback(callback);
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

            self.prepareQuery = function(params){
                self.temp_params = angular.copy(params || self.params);
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

            self.setSortingByString = function(string){
                self.sorting = {};
                self.sorting[string.replace("-", "")] = string.indexOf('-') == -1 ? 'ASC' : 'DESC';
            };

            self.sortingToQuery = function(){
                if(self.manualSorting)
                    return;

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
                    if(angular.isUndefined(value) || value == null || ((angular.isString(value) || angular.isArray(value)) && !value.length)){
                        delete self.temp_params[name];
                        return;
                    }

                    if (name.includes('-lk')) {
                        self.temp_params[name] = '*' + value + '*';
                    } else if(name.includes('-in') && value && value.join) {
                        self.temp_params[name] = value.join(',');
                    }
                });
            }
        };
    }]);
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
                page: '_page',
                id_not_in: 'id-not-in'
            },
            additional_request_params:{},
            response_variables: {
                meta_info: 'meta', //container for total_count, current_page and etc.
                list: 'data', //container for data of response
                total_count: 'total_count',
                filter_count: 'filter_count'
            },
            items_per_page: 10
        };

        this.select_options = {
            ajax_handler: true,
            items_per_page: 15,
            refresh_delay: 200,
            reset_search_input: true
        };

        this.locale = {
            search: 'Search',
            open: 'Open',
            edit: 'Edit',
            save: 'Save',
            cancel: 'Cancel',
            cancel_edit: 'Cancel edit',
            delete: 'Delete',
            delete_confirm: 'Do you want delete object',
            modal: 'Edit',
            not_found: 'Not found.',
            create_new: 'Create New',
            create_new_question: 'Create a New one?'
        };

        return this;
    }]);

/**
 * Created by jonybang on 04.07.15.
 */
angular.module('a-edit')
    .factory('AEditHelpers', [function() {
        var service = {
            //config:
            //  html_attributes
            //  lists_container
            //  list_variable
            //  item_name
            //  field_name
            //  always_edit
            generateDirectiveByConfig: function(field, config, object){
                field = angular.copy(field);

                var output = '';
                var directive = '';

                if(!config)
                    config = {};

                switch(field.type){
                    case 'select':
                    case 'textselect':
                    case 'multiselect':
                        directive = 'select-input';
                        break;
                    case 'date':
                        directive = 'date-input';
                        break;
                    case 'bool':
                        directive = 'bool-input';
                        break;
                    case 'file':
                    case 'multifile':
                        directive = 'file-upload';
                        break;
                    default:
                        directive = 'text-input';
                        break;
                }

                if(field.directive)
                    directive = field.directive;
                else
                    directive = 'ae-' + directive;

                output += '<' + directive + ' ';

                output += 'type="' + (field.type || '') + '" ' +
                    'name="' + (field.input_name || config.input_name || '') + '" ';

                //if(field.width)
                 //   output += 'width="' + field.width + '" ';

                if(field.required)
                    output += 'ng-required="true" ';

                if('get_list' in config)
                    output += 'get-list="' + config.get_list + '" ';

                if(field.url)
                    output += 'url="' + field.url + '" ';

                if(field.resource)
                    output += 'ng-resource="' + field.name + '_resource" ';

                if(field.fields)
                    output += 'ng-resource-fields="' + field.name + '_fields" ';

                if(field.config)
                    output += 'config="' + config.config_variable + '" ';

                if(config.list_variable)
                    output += 'list="' + config.list_variable + '" ';
                else if(config.lists_container)
                    output += 'list="' + config.lists_container + '.' + field.list + '" ';

                var item_name = angular.isUndefined(config.item_name) ? 'item' : config.item_name;
                var field_name = angular.isUndefined(config.field_name) ? field.name : config.field_name;
                var item_field = item_name + (field.name != 'self' ? '.' : '') + field_name;

                var is_edit;
                if(field.readonly || config.readonly)
                    is_edit = 'false';
                else if(config.always_edit)
                    is_edit = 'true';
                else
                    is_edit = item_name + '.is_edit';
                    
                output += 'ng-model="' + item_field + '" ' +
                    'on-save="save(' + item_name + ')" ' +
                    'on-add="save({' + field_name + ': addNgModel, is_new: true})" ' +
                    'has-error="' + item_name + '.errors.' + field_name + '" ' +
                    'ng-model-str="' + item_name + '.' +  field_name + '_str" ' +
                    'ng-model-sub-str="' + item_name + '.' +  field_name + '_sub_str" ' +
                    (config.no_label ? '' : 'label="' + field.label + '" ' )+
                    'view-mode="!' + is_edit + '" '+
                    'is-new="' + (config.is_new ? 'true': 'false') + '" '+
                    'ng-class="{\'edit\':' + (config.is_new ? 'true': is_edit) + '}" '+
                    'placeholder="' + ((config.always_edit ? field.new_placeholder : field.placeholder) || '') + '" ';

                if(field.default_value){
                    if(angular.isFunction(field.default_value))
                        field.default_value = field.default_value(object);

                    output += 'default-value="' + field.default_value + '" ';
                }
                if(directive == 'ae-file-upload')
                    output += 'uploader="' + item_name + '.' + field_name + '__uploader" ';

                if(directive == 'ae-select-input'){
                    output += 'name-field="' + (field.name_field || '') + '" ';
                    output += 'or-name-field="' + (field.or_name_field || '') + '" ';
                    output += 'adder="' + (field.adder || 'false') + '" ';
                }

                if(field.modal && !config.already_modal && field.modal == 'self'){
                    output += 'modal-object="' + item_name + '" ';
                    output += 'modal-options="actualOptions" ';
                }

                output += '></' + directive + '>';

                return output;
            },
            getResourceQuery: function(obj, action, options){
                options = options || {};
                
                var possibleFunctions;
                switch(action){
                    case 'search':
                        possibleFunctions = ['get'];
                        break;
                    case 'get':
                        possibleFunctions = ['query', 'get'];
                        break;
                    case 'show':
                        possibleFunctions = ['$get', 'get'];
                        break;
                    case 'create':
                        possibleFunctions = ['$save', 'create'];
                        break;
                    case 'update':
                        possibleFunctions = ['$update', 'update', '$save'];
                        break;
                    case 'delete':
                        possibleFunctions = ['$delete', 'delete'];
                        break;
                }
                
                var query;
                possibleFunctions.some(function(functionName){
                    if(obj[functionName])
                        query = obj[functionName](options);
                    
                    return obj[functionName];
                });
                
                if(!query){
                    console.error('Undefined model resource! Override getResourceQuery function in AEditHelpers service for define custom resource function.')
                }
                return query.$promise || query;
            },
            isEmptyObject: function(obj) {
                for(var prop in obj) {
                    if (Object.prototype.hasOwnProperty.call(obj, prop)) {
                        return false;
                    }
                }
                return true;
            },
            getNameById: function(list, val, nameField, orNameField){
                var resultName = '';

                if(!list || !list.length)
                    return resultName;

                list.some(function(obj){
                    var result = obj.id == val;
                    if(result)
                        resultName = obj[nameField] || obj.name || obj[orNameField];
                    return result;
                });
                return resultName;
            },
            round5: function(x){
                return Math.floor(x/5)*5;
            },
            debounce: function(func, wait, immediate) {
                var timeout;
                return function() {
                    var context = this, args = arguments;
                    var later = function() {
                        timeout = null;
                        if (!immediate) func.apply(context, args);
                    };
                    var callNow = immediate && !timeout;
                    clearTimeout(timeout);
                    timeout = setTimeout(later, wait);
                    if (callNow) func.apply(context, args);
                };
            }
        };

        return service;
    }]);
