# Natural Language Processing School Project

![Project Logo](https://github.com/Margkoss/natual-language-processing/blob/master/assets/Screenshot%202021-09-10%20205129.png?raw=true)

## Description

This project is an implementation of a school project, that performs common natural language processing processes writen in JavaScript. For this reason `nodeJS` is necessairy to run. Also it uses a MongoDB database, as well as a Redis database. The project is set up in a way, that there is a master process that sets jobs for worker processes (asynchronous Task Queues).

### Project structure

The project is structured using models, services, repositories and managers:

-   **Model Classes**: These are the files that hold descriptions for the entities for the Object Document Mapper (ODM), Mongoose
-   **Repository Classes**: These are classes that hold all common methods for querying entities as documents from the databse

-   **Service Classes**: These are classes that hold service functions for each entity in the database

-   **Manager Classes**: These are classes that contain functions that manage high level app entities, like file imports/exports, the task queue etc.

## Installation

To install depencencies, navigate to the project directory and run the command:

```bash
npm install
```

It is also helpfull to run both database instances in docker, so no installations are needed, and they are not critical instances.

### Redis deployment

```bash
docker run --name redis -p 6379:6379 redis
```

### MongoDB deployment

```bash
docker run --name mongo -p 27017:27017 mongo
```

As long as these containers are not deleted, they will retain their data.

## How to run

For the first part of the project, cron jobs run for adding tasks to the worker processes from this function:

```javascript
private registerCronJobs(): void {
        // Register a cron job for fetching new articles
        cron.schedule('* * * * *', async () => await this.articleService.addArticleJobs());
        Logger.info('Registered cron job for receiving new articles');

        // Register a cron job for POSTagging articles
        cron.schedule('* * * * *', async () => await this.nlpService.addTagJobs());
        Logger.info('Registered cron job for POSTagging Articles in db');

        // Register a cron job for creating manipulating lemmas to create inverted index
        cron.schedule('* * * * *', async () => await this.lemmaService.addLemmaJobs());
        Logger.info('Registered cron job for creating Lemmas in db');

        // Register a cron job for updating the inverted index
        cron.schedule('*/5 * * * *', async () => await this.nlpService.createInvertedIndexJobs());
        Logger.info('Registered cron job for creating Inverted Index in db');
    }
```

As it is clear depending on the amount of articles in the database, worker processes need to be scaled accordingly.

To build and run both the main process, and the worker process execute the commands:

```bash
# Builds the entire project
npm run build

# Run worker threads (databse instances need to be up)
npm run worker

# On seperate shell
npm run start
```

On the main screen you will be greeted with help for available stdin commands, and Logs
