/**
 * Created with JetBrains WebStorm.
 * User: DennisHoeting
 * Date: 13.04.13
 * Time: 18:18
 * To change this template use File | Settings | File Templates.
 */
angular.module('directives', [])
    .directive('objectView', function ($compile) {
        function buildUL(content) {
            var ul = angular.element('<ul></ul>');
            for (property in content) {
                if (content.propertyIsEnumerable(property)) {
                    var prop = content[property];
                    if (prop == undefined) {
                        ul.append('<li>' + property + ': [undefined]</li>');
                    } else if (typeof prop == 'function') {
                        ul.append('<li>' + property + ': [function]</li>');
                    } else if (typeof prop == 'object') {
                        var li = angular.element('<li>' + property + ' : </li>');
                        li.append(buildUL(prop));
                        ul.append(li);
                    } else {
                        ul.append('<li>' + property + ': ' + prop + '</li>');
                    }
                    ;
                }
            }
            return ul;
        };

        function buildJSON(content, depth) {
            var space = '';
            for (var i = 0; i < depth; i++) space += '&nbsp;&nbsp;&nbsp;&nbsp;';
            var base = "{<br />";
            for (property in content) {
                if (content.propertyIsEnumerable(property)) {
                    var prop = content[property];

                    if (prop == undefined) {
                        base += space + '"' + property + ' : [undefined]<br />';
                    } else if (typeof prop == 'function') {
                        base += space + property + ' : [function]<br />';
                    } else if (typeof prop == 'object') {
                        base += space + property + ' : ' + buildJSON(prop, depth + 1) + '<br />';
                    } else {
                        base += space + property + ' : ' + prop + '<br />';
                    }
                    ;
                }
            }
            space = '';
            for (var i = 0; i < depth - 1; i++) space += '&nbsp;&nbsp;&nbsp;&nbsp;';
            base += space + '}';
            return base;
        };

        return {
            restrict: 'E',
            scope: {
                content: '='
            },
            template: '<div></div>',
            replace: true,
            link: function ($scope, elem, attr, ctrl) {
                $scope.$watch('content', function () {
                    switch (attr.type) {
                        case 'json':
                            elem.html(buildJSON($scope.content, 1));
                            break;
                        case 'ul':
                        default:
                            elem.html(buildUL($scope.content));
                            break;
                    }
                }, true);

            }
        };
    })
    .directive('gmButton', function ($timeout) {
        return {
            restrict: 'E',
            replace: true,
            transclude: true,
            template: '<button ng-transclude></button>',
            link: function (scope, element, attrs) {
                $(element).button();
            }
        };
    })
    .directive("gmAlert", function () {
        return{
            restrict: "E",
            template: "<div class=\"alert\" ng-class=\"type && 'alert-' + type\">" +
                "<button type=\"button\" class=\"close\" ng-click=\"close()\">&times;</button>" +
                "<div ng-transclude></div>" +
                "</div>",
            transclude: true,
            replace: true,
            scope: {type: "=", close: "&"}}
    })
    /*
     * FROM http://jsfiddle.net/vojtajina/U7Bz9/
     */
    .directive('whenScrolled', function () {
        return function (scope, elm, attr) {
            var raw = elm[0];

            elm.bind('scroll', function () {
                if (raw.scrollTop + raw.offsetHeight >= raw.scrollHeight) {
                    scope.$apply(attr.whenScrolled);
                }
            });
        };
    })
    .directive('markdown', function () {
        var converter = new Showdown.converter();
        return {
            restrict: 'E',
            link: function (scope, element, attrs) {
                var htmlText = converter.makeHtml(element.text());
                element.html(htmlText);
            }
        };
    })
    .directive('user', function () {
        return {
            restrict: 'E',
            replace: true,
            compile: function (tElement, tAttrs, transclude) {
                tElement.html('<a href="/user/' + tElement.text() + '">' + tElement.text() + '</a>');
            }
        }
    })
    .directive('community', function () {
        return {
            restrict: 'E',
            replace: true,
            link: function (scope, element, attrs) {
                var community = element.text();
                element.html('<a href="/community/' + community + '">' + community + '</a>');
            }
        }
    })
    .directive('slider', function () {
        return {
            link: function (scope, elem, attrs) {
                $(elem).slider({
                    min: 0,
                    max: 100,
                    value: 50,
                    orientation: 'horizontal',
                    slide: function (event, ui) {
                        scope.$apply(function () {
                            scope[attrs.model] = ui.value;
                        });
                    }
                });
            }
        }
    })
    .directive('mapSlider', function () {
        return {
            link: function (scope, elem, attrs) {
                scope.$watch('currentSelection', function (newSelection) {
                    $(elem).slider('value', newSelection);
                });

                // Initialize
                var max = scope.currentAction.dataLength - 1;
                $(elem).slider({
                    min: 0,
                    max: max,
                    value: max,
                    orientation: 'horizontal',
                    slide: function (event, ui) {
                        scope.$apply(function () {
                            scope[attrs.model] = ui.value;
                        });
                    }
                });

                // Reinitialize on late action update
                scope.$on(attrs.event, function (event, action) {
                    max = scope.currentAction.dataLength - 1;

                    //$(elem).slider('destroy');
                    $(elem).slider({
                        min: 0,
                        max: max,
                        value: max,
                        orientation: 'horizontal',
                        slide: function (event, ui) {
                            scope.$apply(function () {
                                scope[attrs.model] = ui.value;
                            });
                        }
                    });

                    // Highlight initially
                    scope.$apply(function () {
                        scope[attrs.model] = max;
                    });
                });
            }
        }
    });


angular.module('ui.bootstrap.pagination', [])
    .directive('pagination', function () {
        return {
            restrict: 'E',
            scope: {
                numPages: '=',
                currentPage: '=',
                onSelectPage: '&'
            },
            template: '' +
                '<div class="pagination"><ul>' +
                '<li ng-class="{disabled: noPrevious()}"><a ng-click="selectPrevious()">&lt;</a></li>' +
                '<li ng-repeat="page in pages" ng-class="{active: isActive(page)}"><a ng-click="selectPage(page)">{{page}}</a></li>' +
                '<li ng-class="{disabled: noNext()}"><a ng-click="selectNext()">&gt;</a></li>' +
                '</ul>' +
                '</div>',
            replace: true,
            link: function (scope) {
                scope.$watch('numPages', function (value) {
                    scope.pages = [];
                    for (var i = 1; i <= value; i++) {
                        scope.pages.push(i);
                    }
                    if (scope.currentPage > value) {
                        scope.selectPage(value);
                    }
                });
                scope.noPrevious = function () {
                    return scope.currentPage === 1;
                };
                scope.noNext = function () {
                    return scope.currentPage === scope.numPages;
                };
                scope.isActive = function (page) {
                    return scope.currentPage === page;
                };

                scope.selectPage = function (page) {
                    if (!scope.isActive(page)) {
                        scope.currentPage = page;
                        scope.onSelectPage({ page: page });
                    }
                };

                scope.selectPrevious = function () {
                    if (!scope.noPrevious()) {
                        scope.selectPage(scope.currentPage - 1);
                    }
                };
                scope.selectNext = function () {
                    if (!scope.noNext()) {
                        scope.selectPage(scope.currentPage + 1);
                    }
                };
            }
        };
    });
