// Code goes here
angular
  .module('a-edit', ['ngMaterial', 'angularMoment', 'ngSanitize', 'cl.paging'])
  
  .run(['amMoment', '$templateCache', function(amMoment, $templateCache) {
    amMoment.changeLocale('ru');

    
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
  }]);
