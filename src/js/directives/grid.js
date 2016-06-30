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
                orderBy: '-id',
                defaultAttrs: {},
                modalIndex: 0,
                searchDebounce: 200,
                fields: [],
                lists: {}
            };

            scope.new_item = {};
            scope.status = "";

            var mode = 'local';

            // *************************************************************
            // TEMPLATE INIT
            // *************************************************************

            scope.$watch('options', function(){
                if(!scope.options)
                    return;

                scope.actualOptions = angular.extend({}, defaultOptions, scope.options);
                AEditConfig.currentOptions = scope.actualOptions;

                var tplSearch =
                    '<div class="input-group">' +
                    '<input type="text" class="form-control" ng-model="searchQuery" placeholder="Search" ng-change="search()" ng-model-options="{ debounce: ' + scope.actualOptions.searchDebounce + ' }"/>' +
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
                    '<tr ng-repeat="item in filtredList track by item.id">';


                scope.actualOptions.fields.forEach(function(field, index){
                    if(field.resource && field.list){
                        if(!scope.actualOptions.lists[field.list]){
                            scope.actualOptions.lists[field.list] = [];

                            AEditHelpers.getResourceQuery(field.resource, 'get').then(function(list){
                                scope.actualOptions.lists[field.list] = list;
                            });
                        }
                    }

                    if(field.table_hide)
                        return;

                    tplHead += '<th>' + field.label + '</th>';

                    if(field.readonly || !scope.actualOptions.edit){
                        tplBodyNewItem += '<th scope="row"></th>';
                        tplBodyItem += '<th scope="row">{{item.' + field.name +'}}</th>';
                    } else {
                        //for new item row
                        tplBodyNewItem += '<td>';
                        //for regular item row
                        tplBodyItem += '<td ng-dblclick="item.is_edit = !item.is_edit">';

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
                                always_edit: is_new,
                                is_new: is_new,
                                list_variable: list_variable
                            });
                        }

                        tplBodyNewItem += getFieldDirective(true) + '</td>';
                        tplBodyItem += getFieldDirective(false) + '</td>';
                    }
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
                        '<icon-button type="danger" glyphicon="remove" ng-click="deleteConfirm(item)"></icon-button>' +
                        '</td>';
                }

                tplHead +='</tr></thead>';

                tplBodyNewItem +='</tr>';

                tplBodyItem +='</tr></tbody></table>';

                var tplHtml = '';

                if(scope.actualOptions.search)
                    tplHtml += tplSearch;

                tplHtml += tplHead;

                if(scope.actualOptions.create)
                    tplHtml += tplBodyNewItem;

                tplHtml += tplBodyItem;

                var template = angular.element(tplHtml);

                var linkFn = $compile(template)(scope);
                element.html(linkFn);
            });


            // *************************************************************
            // CREATE OR UPDATE
            // *************************************************************

            scope.save = function(item){
                if(!item)
                    return;

                item.errors || (item.errors = {});

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

                if(!AEditHelpers.isEmptyObject(item.errors))
                    return;

                var upload_item = angular.copy(item);

                var uploaders = Object.keys(upload_item).filter(function(k){ return ~k.indexOf("__uploader") });
                if(uploaders.length){

                    uploaders.forEach(function(key){

                        function sendAll(){
                            var prop_name = key.replace('__uploader','');
                            if(!upload_item[prop_name]){
                                sendItem();
                                return;
                            }

                            upload_item[prop_name.substring(0, prop_name.length - 1) + '_ids'] = upload_item[prop_name].map(function(obj){
                                return obj.id;
                            });
                            delete upload_item[key];
                            delete upload_item[prop_name];
                            sendItem();
                        }

                        if(!upload_item[key].queue.length){
                            sendAll();
                        } else {
                            upload_item[key].onSuccessItem = function(){
                                if(!upload_item[key].queue.length){
                                    sendAll();
                                }
                            };
                        }
                    });
                } else {
                    sendItem();
                }

                function sendItem(){

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

                    }
                    if('id' in upload_item && upload_item.id){
                        var query = AEditHelpers.getResourceQuery(upload_item, 'update');
                        
                        query.then(function(updated_item){
                            angular.extend(item, updated_item);

                            saveCallbacks(item);
                        });
                    } else {
                        angular.forEach(scope.actualOptions.defaultAttrs, function(value, attr){
                            upload_item[attr] = value;
                        });

                        var query = AEditHelpers.getResourceQuery(new scope.actualOptions.resource(upload_item), 'create');
                        query.then(function(created_item){
                            created_item.is_new = true;

                            scope.ngModel.unshift(created_item);
                            delete scope.new_item;

                            saveCallbacks(item);
                        });
                    }
                }
            };

            // *************************************************************
            // DELETE
            // *************************************************************

            scope.deleteConfirm = function(item){
                if(confirm('Do you want delete object "' + item.name + '"?')){
                    var query = AEditHelpers.getResourceQuery(item, 'delete');
                    
                    query.then(function(){
                        var index = scope.ngModel.indexOf(item);
                        scope.ngModel.splice(index, 1);

                        if(scope.ngChange)
                            $timeout(scope.ngChange);
                    });
                }
            };

            // *************************************************************
            // SEARCH
            // *************************************************************

            scope.search = function(){
                if(!scope.searchQuery)
                    scope.filtredList = scope.ngModel;
                else
                    scope.filtredList = $filter('filter')(scope.ngModel, scope.searchQuery);

                if(scope.actualOptions.orderBy)
                    scope.filtredList = $filter('orderBy')(scope.filtredList, scope.actualOptions.orderBy);
            };

            scope.clearSearch = function(){
                scope.searchQuery = '';
                scope.filtredList = scope.ngModel;
            };

            // *************************************************************
            // WATCHERS
            // *************************************************************

            scope.$watchCollection('ngModel', function(list){
                scope.search();
                scope.actualOptions.lists['self'] = list;
            });
        }
    };
}]);
