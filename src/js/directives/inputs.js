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
