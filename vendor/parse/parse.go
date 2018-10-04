package parse

import (
	"fmt"
	"htmlnode"
	"log"
	"os"
	"strings"
	"util"

	"github.com/PuerkitoBio/goquery"
	"google.golang.org/api/calendar/v3"
)

func summary(title string, abbreviation string) string {
	var str strings.Builder

	str.WriteString(title)
	str.WriteString(" (")
	str.WriteString(abbreviation)
	str.WriteString(")")

	return str.String()
}

// CalendarEvents returns events
func CalendarEvents(filename string) (events []*calendar.Event) {
	f, err := os.Open(filename)

	if err != nil {
		log.Fatalf("Unable to read html file: %v", err)
	}
	defer f.Close()

	doc, err := goquery.NewDocumentFromReader(f)
	if err != nil {
		log.Fatal(err)
	}

	doc.Find(".sessionRow").Each(func(i int, s *goquery.Selection) {
		title := htmlnode.Text(s.Find("span.title"))

		abstract := s.Find("span.abstract")
		description := htmlnode.Text(abstract)

		abbreviation := htmlnode.Text(s.Find("span.abbreviation"))

		summary := summary(title, abbreviation)

		sessionTime := s.Find("ul.availableSessions.sessionTimeList")
		time := htmlnode.Text(sessionTime)
		eventTime := util.ParseEvent(time)

		sessionRoom := s.Find("span.sessionRoom")
		location := htmlnode.Text(sessionRoom)

		event := &calendar.Event{
			Summary:     summary,
			Location:    location,
			Description: description,
			Start: &calendar.EventDateTime{
				DateTime: eventTime.Start.Format("2006-01-02T15:04:05-08:00"),
				TimeZone: "America/Los_Angeles",
			},
			End: &calendar.EventDateTime{
				DateTime: eventTime.End.Format("2006-01-02T15:04:05-08:00"),
				TimeZone: "America/Los_Angeles",
			},
		}

		events = append(events, event)
	})
	return events
}

// Parse processes given document
func Parse(filename string) {
	f, err := os.Open(filename)

	if err != nil {
		log.Fatalf("Unable to read html file: %v", err)
	}
	defer f.Close()

	doc, err := goquery.NewDocumentFromReader(f)
	if err != nil {
		log.Fatal(err)
	}

	// Find the session items
	doc.Find(".sessionRow").Each(func(i int, s *goquery.Selection) {
		title := s.Find("span.title")
		summary := htmlnode.Text(title)

		abstract := s.Find("span.abstract")
		description := htmlnode.Text(abstract)

		abbreviation := s.Find("span.abbreviation")
		acronym := htmlnode.Text(abbreviation)

		sessionTime := s.Find("ul.availableSessions.sessionTimeList")
		time := htmlnode.Text(sessionTime)
		eventTime := util.ParseEvent(time)

		sessionRoom := s.Find("span.sessionRoom")
		location := htmlnode.Text(sessionRoom)
		fmt.Printf("#: %d, summary: %s, acronym: %s, time: %s, startTime: %q, endTime: %q, location: %s\n", i, summary, acronym, time, eventTime.Start, eventTime.End, location)

		fmt.Printf("#: %d, startTime: %q, description: %s\n", i, eventTime.Start, description)
	})
}
