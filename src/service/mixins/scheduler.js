'use strict';

const { is } = require('ramda');
const { CronJob } = require('cron');

const JOB_SCHEDULED = 'job_scheduled';
const JOB_STOPPED = 'job_stopped';

const Scheduler = Super => {
  Super.JOB_SCHEDULED = JOB_SCHEDULED;
  Super.JOB_STOPPED = JOB_STOPPED;

  return class extends Super {
    constructor (options = {}) {
      const { jobs } = options;

      if (!is(Array, jobs))
        throw new TypeError(`'jobs' must be an array.`);

      for (const job of jobs)
        if (!is(Object, job) || !is(String, job.cronTime) || !is(Function, job.onTick))
          throw new TypeError(
            `Each job must have a valid cron 'cronTime' property and an 'onTick' method.`
          );

      super(options);

      this._jobs = jobs;
      this._scheduled = [];
    }

    _onConnect () {
      for (const {
        id,
        cronTime,
        onTick,
        onComplete,
        timezone,
      } of this._jobs) {
        const job = new CronJob(
          cronTime,
          onTick,
          onComplete,
          true, // job starts immediately
          timezone,
          this, // context
        );

        job.id = id;
        job.start();

        this._scheduled.push(job);
        this.emit(JOB_SCHEDULED, job);
      }

      super._onConnect();
    }

    _onDisconnect () {
      for (const job of this._scheduled) {
        job.stop();
        this.emit(JOB_STOPPED, job);
      }

      this._scheduled = [];

      super._onDisconnect();
    }
  };
};

module.exports = Scheduler;
