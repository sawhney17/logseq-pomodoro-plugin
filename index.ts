import '@logseq/libs'
import { SettingSchemaDesc } from '@logseq/libs/dist/LSPlugin'

// Date when the timer was started.
let startTime = Date.now()

// The time remaining when paused.
let remainingTime = null

// The date when the current timer should expire.
let endTime = Date.now()

// Whether the timer is currently stopped. (Starts in stopped state)
let stopped = true

// Whether the timer is currently on break.
let onBreak = false

// The interval that updates the display.
let interval = null

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
  }
]

async function updateDisplay() {
  const remaining = Math.floor(remainingTime / 1000)

  const minute = Math.floor(remaining / 60)
  const second = remaining % 60

  const minuteString = `${minute < 10 ? "0" : ""}${minute}`
  const secondString = `${second < 10 ? "0" : ""}${second}`

  if (!onBreak) {
    logseq.App.registerUIItem("toolbar", {
      key: "pomodoro_timer",
      template: `
        <div><p style="font-size: large; opacity: 50%;" class="button">${minuteString}:${secondString}</p></div>
      `
    })
  } else {
    logseq.App.registerUIItem("toolbar", {
      key: "pomodoro_timer",
      template: `
        <div><p style="font-size: large; opacity: 50%; color: green;" class="button">${minuteString}:${secondString}</p></div>
      `
    })
  }

  if (stopped) {
    logseq.App.registerUIItem("toolbar", {
      key: "pomodoro_pause",
      template: `
        <a data-on-click="toggleStopped" class="button"><i class="ti ti-player-play"></i></a>
      `
    })
  } else {
    logseq.App.registerUIItem("toolbar", {
      key: "pomodoro_pause",
      template: `
        <a data-on-click="toggleStopped" class="button"><i class="ti ti-player-pause"></i></a>
      `
    })
  }

  logseq.App.registerUIItem("toolbar", {
    key: "pomodoro_reset",
    template: `
        <a data-on-click="stopPomodoro" class="button"><i class="ti ti-rotate"></i></a>
    `
  })
}

async function startTimer() {
  console.log("pomodoro startTimer")
  stopped = false

  await updateDisplay()

  if (interval) clearInterval(interval)
  // Make sure it starts by showing :59, if we actually sleep for 1001ms it'll show :58
  setTimeout(updateTimer, 100)
  interval = setInterval(updateTimer, 1000)
}


async function updateTimer() {
  let currentTime = Date.now()
  remainingTime = endTime - currentTime

  if (stopped) {
    clearInterval(interval)
  } else if (currentTime > endTime) {
    clearInterval(interval)
    let notificationText = (onBreak) ?
      "Break is over. Let's get back to work!" :
      "Pomodoro is over. Let's take a break!"

    new Notification(notificationText)
    onBreak = !onBreak
    startTime = Date.now()
    endTime = (!onBreak) ?
      900 + startTime + logseq.settings.pomodoroLength * 60 * 1000 :
      900 + startTime + logseq.settings.breakLength * 60 * 1000
    remainingTime = endTime - startTime

    stopped = !logseq.settings.AutomaticallyStartBreakAfterPomodoro
    if (!stopped) {
      await startTimer()
    }
  }

  await updateDisplay()
}


async function togglePause() {
  console.log("pomodoro togglePause")
  if (stopped) {
    if (startTime === null) {
      startTime = Date.now()
      endTime = startTime + logseq.settings.pomodoroLength * 60 * 1000
      remainingTime = endTime - startTime
    } else {
      startTime = Date.now()
      endTime = startTime + remainingTime
    }

    await startTimer()
  } else {
    clearInterval(interval)
    stopped = true
    remainingTime = endTime - Date.now()
  }

  await updateDisplay()
}


async function stopTimer() {
  console.log("pomodoro stopTimer")
  stopped = true
  onBreak = false
  clearInterval(interval)
  startTime = Date.now()
  endTime = startTime + logseq.settings.pomodoroLength * 60 * 1000
  remainingTime = endTime - startTime
  await updateDisplay()
}


async function main() {
  logseq.useSettingsSchema(settings)
  await Notification.requestPermission()
  logseq.provideModel({
    startPomodoro() {
      startTimer()
    },
    toggleStopped() {
      togglePause()
    },
    stopPomodoro() {
      stopTimer()
    }
  })

  startTime = null
  endTime = Date.now() + logseq.settings.pomodoroLength * 60 * 1000
  remainingTime = 900 + endTime - Date.now()
  await updateDisplay()
  console.log('pomodoro plugin loaded')
}

logseq.ready(main).catch(console.error)