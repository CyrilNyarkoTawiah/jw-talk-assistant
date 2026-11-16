# -*- coding: utf-8 -*-
"""Boot catch-up check for JW Study Assistant weekly prep.
Runs at Windows logon (Task Scheduler: 'JW Study Catchup').
Cheap, no LLM: decides whether the weekly prep job must fire now.
Rules:
  - current meeting week (Monday of this week) file missing  -> catch-up run
  - Friday >= 23:00, or Sat/Sun, and NEXT week's file missing -> run early/catch-up
  - otherwise: do nothing (the scheduled Friday 11pm run owns it)
Appends decisions to catchup.log next to this script.
"""
import datetime
import os
import subprocess
import sys

REPO = r"C:\Users\Cyril\dev\jw-talk-assistant"
PREP = os.path.join(REPO, "src", "data", "prepared")
LOG = os.path.join(os.path.dirname(os.path.abspath(__file__)), "catchup.log")
JOB_ID = "7216f9bb6dac"

def log(msg):
    try:
        with open(LOG, "a", encoding="utf-8") as fh:
            fh.write(datetime.datetime.now().isoformat(timespec="seconds") + "  " + msg + "\n")
    except OSError:
        pass

def main():
    today = datetime.date.today()
    now = datetime.datetime.now()
    monday = today - datetime.timedelta(days=today.weekday())
    next_monday = monday + datetime.timedelta(days=7)

    def exists(d):
        return os.path.exists(os.path.join(PREP, d.isoformat() + ".json"))

    need = None
    if not exists(monday):
        need = monday
    elif today.weekday() == 4 and now.hour >= 23 and not exists(next_monday):
        need = next_monday
    elif today.weekday() in (5, 6) and not exists(next_monday):
        need = next_monday

    if need is None:
        log("no action: current=%s next=%s" % (exists(monday), exists(next_monday)))
        return 0

    log("catch-up needed for %s -> running cron job %s" % (need.isoformat(), JOB_ID))
    try:
        subprocess.Popen(
            "hermes cron run " + JOB_ID,
            shell=True,
            cwd=REPO,
            stdout=open(os.path.join(os.path.dirname(LOG), "catchup_run.out"), "ab"),
            stderr=subprocess.STDOUT,
        )
        log("cron run dispatched")
    except Exception as exc:  # pragma: no cover
        log("ERROR dispatching: %r" % (exc,))
        return 1
    return 0

if __name__ == "__main__":
    sys.exit(main())
