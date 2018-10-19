package util

import (
	"fmt"
	"os"
	"regexp"
	"strings"
	"time"
)

// Mon Jan 2 15:04:05 -0700 MST 2006
const (
	TimeLayout  = "Monday, Jan 02, 3:04 PM -0700 MST 2006"
	timePostfix = "-0800 PST 2018"
)

var eventTemplte = regexp.MustCompile(`^[[[:alpha:]]+\, [[:alpha:]]{3} [[:digit:]]{2}, [[:digit:]]{1,2}\:[[:digit:]]{2} [[:alpha:]]{2} - [[:digit:]]{1,2}:[[:digit:]]{2} [[:alpha:]]{2}`)

//Event holds start and end times
type Event struct {
	Start time.Time
	End   time.Time
}

func CheckErr(err error) {
	if err != nil {
		panic(err)
	}
}

func CreateDirIfNotExist(dir string) {
	if _, err := os.Stat(dir); os.IsNotExist(err) {
		err = os.MkdirAll(dir, 0755)
		if err != nil {
			panic(err)
		}
	}
}

// ParseTime returns time derived from "2006 Monday, Jan 02, 3:04 PM" template
func ParseTime(in string) time.Time {
	parsedTime, err := time.Parse(TimeLayout, in)
	if err != nil {
		panic(err)
	}
	return parsedTime
}

func validEvent(in string) bool {
	return eventTemplte.MatchString(in)
}

// ParseEvent expects a string in the format of "Thursday, Nov 29, 1:00 PM -0800 PST 2018"
// It returns an event that contains start and end time
func ParseEvent(in string) Event {
	if !validEvent(in) {
		err := fmt.Errorf("invalid event: %q", in)
		panic(err)
	}

	start, endTimeStr := splitEvent(in)
	end := formEndTime(start, endTimeStr)

	startFormatted := addTZ(start)
	endFormatted := addTZ(end)

	startTime := ParseTime(startFormatted)
	endTime := ParseTime(endFormatted)

	return Event{startTime, endTime}
}

func formEndTime(start string, endTime string) string {
	var str strings.Builder
	date := strings.SplitAfterN(start, ",", 3)

	str.WriteString(date[0])
	str.WriteString(date[1])
	str.WriteString(" ")
	str.WriteString(endTime)

	return str.String()
}

func splitEvent(in string) (string, string) {
	split := strings.Split(in, "-")

	return strings.TrimSpace(split[0]), strings.TrimSpace(split[1])
}

func addTZ(in string) string {
	var str strings.Builder
	str.WriteString(in)
	str.WriteString(" ")
	str.WriteString(timePostfix)

	return str.String()
}
