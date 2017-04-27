# Awesome Edit angular module

## ae-select-input
|attribute|type|description|
|---|---|---|
|ng-model|single value or array of values (if type == multiselect)|Result of selected items as id or value|
|type|string|Possible options: select, multiselect, textselect. Default: select.|
|ng-resource|instance of angular $resource|Used for ajax exchange with server(get list or create new items)|
|get-list|boolean|Need to get list from server on directive initialize|
|params|key-value dictionary ({your_key: your_value} for example)|Additional params for get list from server and for create new items|
|adder|boolean|Possibility to create new items if search has not given any results|
|list|array of items|Local array of items for display in select options for possibility to use without ng-resource.|
|

Angular directives for admin interface and grid edit.

Example: http://plnkr.co/edit/hyGYnsN1OBURmyVlYvlB?p=preview
