// Code goes here
angular
  .module('a-edit', ['ui.bootstrap', 'angularMoment', 'ui.select', 'ngSanitize'])
  
  .run(['amMoment', 'uiSelectConfig', '$templateCache', function(amMoment, uiSelectConfig, $templateCache) {
    amMoment.changeLocale('ru');
    uiSelectConfig.theme = 'bootstrap';
    
    $templateCache.put('a-edit-image-popover.html', '<img class="img-responsive" ng-src="{{::image}}" alt="">');
    
    $templateCache.put('a-edit-date-input.html', '\
            <div class="date-input">\
            <span ng-if="!isEdit">{{ngModelStr}}</span>\
            \
            <div ng-if="isEdit" class="input-group">\
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
        <span ng-if="!isEdit" ng-class="[\'glyphicon\',{\'glyphicon-check\': $parent.fakeModel, \'glyphicon-unchecked\': !$parent.fakeModel}]"></span>\
        <input ng-if="isEdit" ng-model="$parent.fakeModel" type="checkbox" class="form-control" name="{{$parent.name}}" ng-change="$parent.change()">\
    ');

    $templateCache.put('a-edit-popover-image.html', '\
        <a target="_blank" href="{{::image}}" uib-popover-template="imagePopoverPath" popover-placement="left" popover-trigger="mouseenter">\
            {{:: text || image}}\
        </a>\
    ');
    
  }]);

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
    }])

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
    })

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

            return '' +
            '<div ng-if="!isEdit">' +
                text +
            '</div>' +
            '<div ng-if="isEdit" ng-class="input_class">' +
                inputTagBegin +
                ' class="form-control input-sm" placeholder="{{$parent.placeholder}}"' +
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
                isEdit: '=?',
                modalObject: '=?',
                modalOptions: '=?',
                hasError: '=?',
                ngDisabled: '=?',
                //callbacks
                ngChange: '&',
                onSave: '&',
                //sub
                placeholder: '@',
                name: '@',
                width: '@',
                required: '@',
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
    }])

    .directive('aeBoolInput', ['$timeout', '$filter', function($timeout, $filter) {
        return {
            restrict: 'E',
            templateUrl: 'a-edit-bool-input.html',
            scope: {
                //require
                ngModel: '=',
                isEdit: '=',
                //callbacks
                ngChange: '&',
                onSave: '&',
                //sub
                name: '@'
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
    }])


    .directive('aeDateInput', ['$timeout', '$filter', function($timeout, $filter) {
        return {
            restrict: 'E',
            templateUrl: 'a-edit-date-input.html',
            scope: {
                //require
                ngModel: '=',
                ngModelStr: '=?',
                ngModelSubStr: '=?',
                isEdit: '=',
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
    }])

    .directive('aeSelectInput', ['$timeout', '$compile', '$templateCache', 'AEditHelpers' ,'AEditConfig', function($timeout, $compile, $templateCache, AEditHelpers, AEditConfig) {
        function getTemplateByType(type, options){
            options = options || {};

            var uiSelect = {
                attributes: '',
                match: 'selectedName',
                itemId: 'item.id',
                itemName: '(item[$parent.nameField] || item.name || item[$parent.orNameField])',
                subClasses: ''
            };
            if(type == 'multiselect'){
                uiSelect.attributes = 'multiple close-on-select="false"';
                uiSelect.match = '$item[$parent.nameField] || $item.name || $item[$parent.orNameField]';
            }
            if(type == 'textselect'){
                uiSelect.itemId = '';
                uiSelect.itemName = 'item';
            }
            if(options.adder){
                uiSelect.subClasses = 'btn-group select-adder';
            }

            var template = '' +
                '<div class="select-input-container ' + uiSelect.subClasses + ' {{input_class}}">' +
                    '<span ng-if="!isEdit">{{selectedName}}</span>' +
                    '<input type="hidden" name="{{name}}" ng-bind="ngModel" class="form-control" required />' +

                    '<div ng-if="isEdit">' +
                        '<ui-select ' + uiSelect.attributes + ' ng-model="options.value" ng-click="changer()" class="input-small" reset-search-input="{{resetSearchInput}}" on-select="onSelectItem($select)">' +
                            '<ui-select-match placeholder="">' +
                                '<a class="close clear-btn" ng-click="clearInput($event)"><span>×</span></a>' +
                                '{{' + uiSelect.match + '}}' +
                            '</ui-select-match>' +

                            '<ui-select-choices refresh="getListByResource($select.search)" refresh-delay="{{refreshDelay}}" repeat="' + (uiSelect.itemId ? uiSelect.itemId + ' as ' : '') + 'item in $parent.local_list | filter: $select.search track by $index">' +
                                '<div ng-bind-html="' + uiSelect.itemName + ' | highlight: $select.search"></div>' +
                            '</ui-select-choices>' +
                        '</ui-select>';

            if(options.adder){
                template += '' +
                    '<button type="button" class="btn btn-success" ng-click="popover.is_open = true"' +
                        ' uib-popover-template="popover.template_name"' +
                        ' uib-popover-title="Add object"' +
                        ' popover-placement="top"' +
                        ' popover-append-to-body="true"' +
                        ' popover-is-open="popover.is_open"' +
                        ' popover-trigger="none">' +
                            '<span class="glyphicon glyphicon-plus"></span>' +
                    '</button>';
            }

            template += '</div>' +
                '</div>';
            return template;
        }

        var typeTemplates = {
            'select': $compile(getTemplateByType('')),
            'select-adder': $compile(getTemplateByType('', {adder: true})),
            'textselect': $compile(getTemplateByType('textselect')),
            'textselect-adder': $compile(getTemplateByType('textselect', {adder: true})),
            'multiselect': $compile(getTemplateByType('multiselect')),
            'multiselect-adder': $compile(getTemplateByType('multiselect', {adder: true}))
        };

        return {
            restrict: 'E',
            require: 'ngModel',
            scope: {
                //require
                list: '=?',
                ngModel: '=',
                ngModelStr: '=?',
                isEdit: '=?',
                hasError: '=?',

                ngResource: '=?',
                ngResourceFields: '=?',

                refreshListOn: '=?',

                //callbacks
                ngChange: '&',
                onSave: '&',
                onSelect: '&',
                //sub
                adder: '=?',
                getList: '=?',
                nameField: '@',
                orNameField: '@',
                placeholder: '@',
                name: '@',
                type: '@' //select or multiselect
            },
            link: function (scope, element, attrs, ngModel) {
                //=============================================================
                // Config
                //=============================================================
                var variables = angular.extend({}, AEditConfig.grid_options.request_variables, AEditConfig.grid_options.response_variables);

                scope.refreshDelay = AEditConfig.select_options.refresh_delay;
                scope.resetSearchInput = AEditConfig.select_options.reset_search_input;

                scope.options = {
                    value: scope.ngModel
                };

                scope.full_type = scope.type = scope.type || 'select';
                if(scope.adder)
                    scope.full_type += '-adder';

                //=============================================================
                // Compile
                //=============================================================
                var template = typeTemplates[scope.full_type],
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

                //=============================================================
                // Output validation
                //=============================================================
                scope.$watch('hasError', function(hasError){
                    scope.input_class = hasError ? "has-error" : '';
                });

                //=============================================================
                // Callbacks
                //=============================================================
                scope.onSelectItem = function($select){
                    //fix ui-select bug
                    if(scope.resetSearchInput && $select)
                        $select.search = '';

                    $timeout(scope.onSelect);
                    $timeout(scope.ngChange);
                };
                scope.clearInput = function($event){
                    $event.stopPropagation();
                    scope.ngModel = scope.type == 'multiselect' ? [] : null;
                    $timeout(scope.ngChange);
                };
                scope.save = function(){
                    if(scope.onSave)
                        $timeout(scope.onSave);
                };

                //=============================================================
                // Hotfix for work with ngModel and ui-select
                //=============================================================
                scope.changer = function() {
                    ngModel.$setViewValue(scope.options.value)
                };

                scope.$watch('ngModel', function(newVal){
                    if(scope.options.value == newVal)
                        return;

                    scope.options.value = newVal;

                    scope.setSelectedName(newVal);
                });

                //TODO: optimize
                scope.$watch(function() {
                    return ngModel.$viewValue;
                }, function(newVal) {
                    scope.ngModel = newVal;
                    scope.setSelectedName(newVal);
                });

                //=============================================================
                // Init select list
                //=============================================================
                function initListGetByResource(){
                    if(!scope.ngResource || !scope.getList || (scope.local_list && scope.local_list.length))
                        return;

                    scope.getListByResource();
                }
                scope.getListByResource = function (query){
                    if(!scope.ngResource)
                        return;

                    var request_options = {};
                    if(query)
                        request_options[variables['query']] = query;

                    request_options[variables['limit']] = AEditConfig.select_options.items_per_page;

                    AEditHelpers.getResourceQuery(scope.ngResource, 'get', request_options).then(function(list){
                        scope.local_list = list;
                        scope.setSelectedName(scope.ngModel);
                    });
                };

                scope.$watch('ngResource', initListGetByResource);
                scope.$watch('refreshListOn', initListGetByResource);

                //=============================================================
                // Output non edit mode
                //=============================================================
                scope.$watch('list', function(list){
                    scope.local_list = list;
                    scope.setSelectedName(scope.ngModel);
                });
                scope.setSelectedName = function (newVal){
                    if(!scope.local_list || !scope.local_list.length)
                        return;

                    if(scope.type == 'textselect'){
                        scope.selectedName = newVal ? newVal : '';
                        return;
                    }

                    if(Array.isArray(newVal)){
                        // if ngModel - array of ids
                        var names = [];
                        newVal.forEach(function(id){
                            // get from current list by id
                            var result_name = AEditHelpers.getNameById(scope.local_list, id, scope.nameField, scope.orNameField);
                            if(result_name){
                                names.push(result_name);
                            } else if(scope.ngResource){
                                // if object with id not exist in current list - get from server
                                getObjectFromServer(id).then(function(object){
                                    names.push(getNameFromObj(object));
                                    scope.selectedName = names.join(', ');
                                    scope.ngModelStr = scope.selectedName;
                                    scope.local_list.push(object)
                                })
                            }
                        });
                        scope.selectedName = names.join(', ');
                    } else {
                        // get from current list by id
                        scope.selectedName = AEditHelpers.getNameById(scope.local_list, newVal, scope.nameField, scope.orNameField);

                        // if object with id not exist in current list - get from server
                        if(!scope.selectedName && newVal && scope.ngResource){
                            getObjectFromServer(newVal).then(function(object){
                                scope.selectedName = getNameFromObj(object);
                                scope.ngModelStr = scope.selectedName;
                                scope.local_list.push(object);
                            })
                        }
                    }
                    scope.ngModelStr = scope.selectedName;
                };

                function getObjectFromServer(id){
                    return AEditHelpers.getResourceQuery(scope.ngResource, 'show', {id: id});
                }
                function getNameFromObj(obj){
                    return obj[scope.nameField] || obj.name || obj[scope.orNameField];
                }

                //=============================================================
                // Compile Adder button
                //=============================================================
                if(scope.adder){
                    scope.new_object = {};

                    var popoverTemplate = '' +
                        '<div ng-click="popoverContentClick($event)">';

                    if(scope.type == 'textselect' && !scope.ngResourceFields)
                        scope.ngResourceFields = [{name: 'name', label: ''}];

                    scope.ngResourceFields.forEach(function(field){
                        popoverTemplate += '' +
                            '<div class="form-group col-md-12 row">' +
                                '<div>' +
                                    '<label>' + field.label + '</label>' +
                                '</div>' +
                                '<div>' +
                                    AEditHelpers.generateDirectiveByConfig(field, {
                                        item_name: '$parent.new_object',
                                        lists_container: 'lists',
                                        always_edit: true,
                                        is_new: true
                                        //already_modal: true
                                    }) +
                                '</div>' +
                            '</div>';

                        if(field.resource){
                            scope[field.name + '_resource'] = field.resource;
                        }

                        if(field.type == 'multiselect'){
                            scope.new_object[field.name] = [];
                        }
                    });

                    popoverTemplate += '' +
                            '<div class="form-group col-md-12 row">' +
                                '<button type="submit" class="btn btn-primary" ng-click="$parent.saveToList(new_object);">Save</button>' +
                                '<button class="btn btn-danger pull-right" ng-click="$parent.popover.is_open = false">Close</button>' +
                            '</div>' +
                        '</div>';

                    scope.popover = {
                        is_open: false,
                        template_name: attrs.ngModel + '-' + attrs.ngResource + '.html'
                    };
                    $templateCache.put(scope.popover.template_name, popoverTemplate);
                }

                //=============================================================
                // Add new item to select list by adder
                //=============================================================
                scope.saveToList = function(new_object){
                    scope.popover.is_open = false;

                    if(scope.type == 'textselect'){
                        //get first property of object and add it to list
                        var is_first_prop = true;
                        angular.forEach(new_object, function(prop_value){
                            if(is_first_prop){
                                scope.local_list.unshift(prop_value);
                                scope.ngModel = prop_value;
                            }
                            is_first_prop = false;
                        });
                        return;
                    }

                    AEditHelpers.getResourceQuery(new scope.ngResource(new_object), 'create').then(function(object){
                        scope.local_list.unshift(object);

                        if(angular.isArray(scope.ngModel))
                            scope.ngModel.push(object.id);
                        else
                            scope.ngModel = object.id;
                    });
                }
            }
        };
    }])

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

            result +=   '<ul ng-if="isEdit" class="list-unstyled">' +
                            '<li ng-repeat="item in uploader.queue">' +
                                '<popover-image ng-model="item.file" text="item.file.name"></popover-image>' +
                                '<a href ng-click="item.remove()"><span class="glyphicon glyphicon-remove"></span></a>' +
                            '</li>' +
                        '</ul>' +
                        '<span ng-if="isEdit && uploader" class="btn btn-sm btn-default btn-file">' +
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
                isEdit: '=?',
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

                if(scope.isEdit)
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
                    if(!newVal && scope.isEdit)
                        initUploader();
                });
                scope.$watch('isEdit', function(newVal){
                    if(newVal)
                        initUploader();
                })
            }
        };
    }]);

angular
    .module('a-edit')

    .directive('aeObjectModal', ['$timeout', '$log', '$cacheFactory', 'AEditHelpers', 'AEditConfig', '$uibModal', function($timeout, $log, $cacheFactory, AEditHelpers, AEditConfig, $uibModal) {
        var cache = $cacheFactory('aModal.Templates');

        return {
            restrict: 'A',
            scope: {
                //require
                aeObjectModal: '=',
                modalResourceOptions: '=?',
                isEdit: '=?',
                //callbacks
                onSave: '&'
            },
            link: function (scope, element, attrs) {

                var resource_name = attrs.aeObjectModal + new Date().getTime();
                scope.options = scope.modalResourceOptions || AEditConfig.current_options;

                element.on("click", function () {
                    var template = cache.get(resource_name) || '';
                    if(!template){
                        template +=
                            '<div class="modal-header">' +
                                '<button ng-click="cancel()" class="close pull-right"><span>&times;</span></button>' +
                                '<h3 class="modal-title">Awesome modal!</h3>' +
                            '</div>' +
                            '<div class="modal-body">' +
                                '<button type="button" class="btn btn-warning btn-sm pull-right" ng-click="object.is_edit = !object.is_edit">' +
                                    '<span class="glyphicon glyphicon-pencil" aria-hidden="true"></span>' +
                                '</button>' +
                                '<dl class="dl-horizontal">';
                        
                        scope.options.fields.forEach(function(field){
                            template += '<dt>' + field.label + '</dt>';
                            template += '<dd>' + AEditHelpers.generateDirectiveByConfig(field, {
                                item_name: 'object',
                                lists_container: 'lists',
                                already_modal: true
                            }) + '</dd>';
                        });
                        
                        template +=
                                '</dl>' +
                            '</div>' +
                            '<div class="modal-footer">' +
                                '<button class="btn btn-primary" type="button" ng-click="ok()">OK</button>' +
                            '</div>';
                            
                        cache.put(resource_name, template);
                    }

                    var modalInstance = $uibModal.open({
                        animation: true,
                        template: template,
                        resolve: {
                            data: function () {
                                return {
                                    object: angular.copy(scope.aeObjectModal),
                                    resource: scope.options.resource,
                                    lists: scope.options.lists,
                                    isEdit: scope.isEdit
                                };
                            }
                        },
                        controller: ['$scope', '$uibModalInstance', 'data', function($scope, $uibModalInstance, data) {
                            angular.extend($scope, data);


                            AEditHelpers.getResourceQuery(new scope.options.resource($scope.object), 'show').then(function(object){
                                $scope.object = object;
                                $scope.object.is_edit = data.isEdit;
                                console.log('modal controller', $scope.object);
                            });
                            
                            $scope.ok = function () {
                                $scope.object.is_edit = false;
                                $uibModalInstance.close($scope.object);
                            };
                            $scope.cancel = function () {
                                $uibModalInstance.dismiss('cancel');
                            };
                        }],
                        size: 'lg'
                    });

                    modalInstance.result.then(function (object) {
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
            generateDirectiveByConfig: function(field, config){
                var output = '';
                var directive = '';

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

                output += '<ae-' + directive + ' ';

                output += 'type="' + (field.type || '') + '" ' +
                    'input-name="' + (field.input_name || '') + '" ';

                if(field.width)
                    output += 'width="' + field.width + '" ';

                if(field.required)
                    output += 'required="true" ';

                if('get_list' in config)
                    output += 'get-list="' + config.get_list + '" ';

                if(field.url)
                    output += 'url="' + field.url + '" ';

                if(field.resource)
                    output += 'ng-resource="' + field.name + '_resource" ';

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
                    'has-error="' + item_name + '.errors.' + field_name + '" ' +
                    'ng-model-str="' + item_name + '.' +  field_name + '_str" ' +
                    'ng-model-sub-str="' + item_name + '.' +  field_name + '_sub_str" ' +
                    'is-edit="' + is_edit + '" '+
                    'is-new="' + (config.is_new ? 'true': 'false') + '" '+
                    'placeholder="' + ((config.always_edit ? field.new_placeholder : field.placeholder) || '') + '" ';

                if(directive == 'file-upload')
                    output += 'uploader="' + item_name + '.' + field_name + '__uploader" ';

                if(directive == 'select-input'){
                    output += 'name-field="' + (field.name_field || '') + '" ';
                    output += 'or-name-field="' + (field.or_name_field || '') + '" ';
                    output += 'adder="' + (field.adder || 'false') + '" ';
                }

                if(field.modal && !config.already_modal && field.modal == 'self'){
                    output += 'modal-object="' + item_name + '" ';
                    output += 'modal-options="actualOptions" ';
                }

                output += '></ae-' + directive + '>';

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
            getNameById: function (list, val, nameField, orNameField){
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
            }
        };

        return service;
    }]);
