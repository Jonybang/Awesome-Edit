<!DOCTYPE html>
<html>
<head>
    @@include('./header.chunk')

    <title>Awesome Edit Examples</title>
</head>

<body ng-app="app" ng-strict-di="" ng-cloak class="md-padding">

    <h1>Awesome Edit module examples</h1>

    <h2>ae-grid directive:</h2>

    <p>Directive for make flexible table by lists of objects(from server or local, like json). The directive provides such basic facilities for working with objects as: search, create new objects, edit exist objects, delete objects, open modal with edit possibility.</p>

    <md-content layout="row">
        <md-content layout="column" flex="60">
            @@include('../main/main.html')
        </md-content>

        <md-content layout="column" flex="40">
            <pre class="prettyprint"><code class="language-js">@@include('../main/main.js')</code></pre>
        </md-content>
    </md-content>

    @@include('./footer.chunk')

    <script src="main/main.js"></script>
</body>
</html>