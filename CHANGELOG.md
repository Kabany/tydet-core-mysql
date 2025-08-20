# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [v2.0.2] 2025-08-20
### Fixed
* Add in error message the details about the MYsqlValitationError.


## [v2.0.1] 2025-03-14
### Fixed
* Fix typo on Prototype Error.captureStackTrace for MysqlEntityNotFound class.

## [v2.0.0] 2025-04-08
### Add
* Add `onDisconnected` and `onConnected` callbacks for MsqlConnector and `onStatusUpdate` callback for the `MysqlMigrationHandler` tool.
### Updated
* Call `super` on lifecycle events.

## [v1.0.6] 2025-03-14
### Fixed
* Fix typo for number and boolean values in the Entity Constructor method
* Fix unique validation, search for column name in database instead of the schema parameter's name

## [v1.0.5] 2025-03-12
### Fixed
* Consider the column validations in the schema definition.

## [v1.0.4] 2025-03-06
### Fixed
* Remove variables

## [v1.0.3] 2025-03-06
### Fixed
* Rename minLen to minLength and maxLen to maxLength
* Skip validation for null values for min and max values if the column is not required.
* Refactor parameter validations in the entity schema definition
* Add PK validation: Must be only one PK.
* Add unique validation
### Added
* Export MysqlCoreError, MysqlEntityDefinitionError, MysqlEntityValidationError and MysqlEntityNotFound

## [v1.0.2] 2025-01-28
### Added
* Add FindOneOrThrow method to throw an exception if item not found.

## [v1.0.1] 2024-10-09
* Update 'typescript', 'uuid', 'mysql', 'tydet-utils', 'tydet-core-logger' and 'tydet-core' repositories.

## [v1.0.0] 2024-04-25
### Added
* Mysql Connector Service.
* Mysql Core Error.
* Mysql Migration Handler and Class.
* Mysql QueryBuilder: Create Table, Rename Table, Alter Table, Drop Table, Find, FindOne, Count, Update, Remove.
* Mysql Entity: Find, FindOne, Count, UpdateAll, RemoveAll, insert, update, remove, populate.
* Mysql Entity relationships: hasOne, belongsTo, hasMany, belongsToMany.
* Mysql Utils Entites Compare.
