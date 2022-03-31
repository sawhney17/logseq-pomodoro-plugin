import '@logseq/libs';
import { SettingSchemaDesc } from '@logseq/libs/dist/LSPlugin';

var timer = 10
var stopped = true
var interval
var onBreak = false

let settings: SettingSchemaDesc[] = [
  {
    key: "pomodoroLength",
    type: "number",
    title: "Pomodoro Length",
    description: "Set the length of your pomodoro in minutes",
    default: "25"
  },
  {
    key: "breakLength",
    type: "number",
    title: "Break Length",
    description: "Set the length of your break in minutes",
    default: "5"
  },
  {
    key: "AutomaticallyStartBreakAfterPomodoro",
    type: "boolean",
    title: "Automatically switch timer upon completion?",
    description: "Automatically Start Break after Pomodoro(and pomodoro after break)?",
    default: true
  },
]
logseq.useSettingsSchema(settings)
async function startTimer() {
  if (!onBreak) {
    timer = logseq.settings.pomodoroLength * 60
  }
  else {
    timer = timer = logseq.settings.breakLength * 60
  }
  const minute = Math.floor(timer / 60);
  //convert timer, in seconds to minutes and seconds
  const second = timer % 60;
  //add a zero in front of numbers<10
  const minuteString = minute < 10 ? "0" + minute : minute;
  const secondString = second < 10 ? "0" + second : second;
  logseq.App.registerUIItem("toolbar", {
    key: "pomodoro_timer", template: `
    <div><p style="font-size: large; opacity: 50%;" class="button">${minuteString}:${secondString}</p></div>`
  })
  if (stopped) {
    logseq.App.registerUIItem("toolbar", {
      key: "pomodoro_pause", template: `
      <a data-on-click="toggleStopped" class = 'button'><i class="ti ti-player-play"></i></a>` });
  }
  else {
    logseq.App.registerUIItem("toolbar", {
      key: "pomodoro_pause", template: `
            <a data-on-click="toggleStopped" class = 'button'><i class="ti ti-player-pause"></i></a>` });
  }
  logseq.App.registerUIItem("toolbar", {
    key: "pomodoro_reset", template: `
        <a data-on-click = "stopPomodoro" class = 'button'><i class="ti ti-rotate"></i></a>` });

}
function updateTimer() {
  const minute = Math.floor(timer / 60);
  //convert timer, in seconds to minutes and seconds
  const second = timer % 60;
  //add a zero in front of numbers<10
  const minuteString = minute < 10 ? "0" + minute : minute;
  const secondString = second < 10 ? "0" + second : second;
  //display the timer in the div
  if (!onBreak) {
    logseq.App.registerUIItem("toolbar", {
      key: "pomodoro_timer", template: `
    <div><p style="font-size: large; opacity: 50%;" class="button">${minuteString}:${secondString}</p></div>`
    });
  }
  else {
    logseq.App.registerUIItem("toolbar", {
      key: "pomodoro_timer", template: `
      <div><p style="font-size: large; opacity: 50%; color: green;" class="button">${minuteString}:${secondString}</p></div>`
    });
  }
  timer -= 1
  if (stopped) {
    clearInterval(interval)
  }
  else if (timer < 1) {
    clearInterval(interval)
    let notificationText
    if (onBreak) {
      notificationText = "Break is over. Let's get back to work!"
    }
    else {
      notificationText = "Pomodoro is over. Let's take a break!"
    }
    new Notification(notificationText);
    onBreak = !onBreak
    console.log(logseq.settings.AutomaticallyStartBreakAfterPomodoro)

    startTimer()
    interval = setInterval(updateTimer, 1000);
    if (!logseq.settings.AutomaticallyStartBreakAfterPomodoro) {
togglePause()
    }
    else{
      // togglePause()
      // interval = setInterval(updateTimer, 1000);

    }
    
  }
}

function togglePause() {
  stopped = !stopped
  if (stopped) {
    logseq.App.registerUIItem("toolbar", {
      key: "pomodoro_pause", template: `
        <a data-on-click="toggleStopped" class = 'button'><i class="ti ti-player-play"></i></a>` });
  }
  else {
    logseq.App.registerUIItem("toolbar", {
      key: "pomodoro_pause", template: `
        <a data-on-click="toggleStopped" class = 'button'><i class="ti ti-player-pause"></i></a>` });
    interval = setInterval(updateTimer, 1000);
  }
}
async function stopTimer() {
  stopped = true
  onBreak = false
  clearInterval(interval)
  startTimer()
}


const main = async () => {
  Notification.requestPermission()
  console.log('plugin loaded');
  logseq.provideModel({
    startPomodoro() {
      startTimer();

    },
    toggleStopped() {
      togglePause()
    },
    stopPomodoro() {
      stopTimer()
    }
  })
  // logseq.App.registerUIItem("toolbar", {
  //   key: "pomodoro_timer", template: `
  //   <a data-on-click="startPomodoro" class="button"><i class="ti ti-clock"></i></a>` });
  startTimer()
}
logseq.ready(main).catch(console.error);
