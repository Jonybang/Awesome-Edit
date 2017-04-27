# Awesome Edit angular module

## ae-select-input
Select input for easy to work with ajax arrays and id fields. For example: if need to set `type_id` field for object: `$scope.page` from user interface:
```
<ae-select-input label="Page type:" ng-model="page.type_id" ng-resource="typeResource" get-list="true" name-field="title"></ae-select-input>
```
In javascript:
```
$scope.page = {
  id: 12,
  name: 'My page',
  type_id: null
};

$scope.typeResource = $resource('/api/type/:typeId', {typeId:'@id'});
```

|attribute|type|description|
|---|---|---|
|ng-model|single value or array of values (if type == multiselect)|Result of selected items as id or value|
|type|string|Possible options: select, multiselect, textselect. Default: select.|
|ng-resource|instance of angular $resource|Used for ajax exchange with server(get list or create new items)|
|get-list|boolean|Need to get list from server on directive initialize|
|params|key-value dictionary ({your_key: your_value} for example)|Additional params for get list from server and for create new items|
|adder|boolean|Possibility to create new items if search has not given any results|
|ng-resource-fields|array|Works as part of the ae-grid configuration - determines the list and types of fields for create new items(default - one name field)|
|list|array of items|Local array of items for display in select options for possibility to use without ng-resource.|
|name-field|string|Determine field name for display in select options|
|or-name-field|string|Determine field name for display in select options if 'name' field get undefined|
|label|string|Label for select input|
|default-value|string or nubmer|Value for set by default|


Angular directives for admin interface and grid edit.

Example: http://plnkr.co/edit/hyGYnsN1OBURmyVlYvlB?p=preview
