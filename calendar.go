package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"regexp"
	"time"

	"golang.org/x/net/context"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
	"google.golang.org/api/calendar/v3"
)

// Retrieve a token, saves the token, then returns the generated client.
func getClient(config *oauth2.Config) *http.Client {
	tokFile := "token.json"
	tok, err := tokenFromFile(tokFile)
	if err != nil {
		tok = getTokenFromWeb(config)
		saveToken(tokFile, tok)
	}
	return config.Client(context.Background(), tok)
}

// Request a token from the web, then returns the retrieved token.
func getTokenFromWeb(config *oauth2.Config) *oauth2.Token {
	authURL := config.AuthCodeURL("state-token", oauth2.AccessTypeOffline)
	log.Printf("Go to the following link in your browser then type the "+
		"authorization code: \n%v\n", authURL)

	var authCode string
	if _, err := fmt.Scan(&authCode); err != nil {
		log.Fatalf("Unable to read authorization code: %v", err)
	}

	tok, err := config.Exchange(oauth2.NoContext, authCode)
	if err != nil {
		log.Fatalf("Unable to retrieve token from web: %v", err)
	}
	return tok
}

// Retrieves a token from a local file.
func tokenFromFile(file string) (*oauth2.Token, error) {
	f, err := os.Open(file)
	defer f.Close()
	if err != nil {
		return nil, err
	}
	tok := &oauth2.Token{}
	err = json.NewDecoder(f).Decode(tok)
	return tok, err
}

// Saves a token to a file path.
func saveToken(path string, token *oauth2.Token) {
	log.Printf("Saving credential file to: %s\n", path)
	f, err := os.OpenFile(path, os.O_RDWR|os.O_CREATE|os.O_TRUNC, 0600)
	defer f.Close()
	if err != nil {
		log.Fatalf("Unable to cache oauth token: %v", err)
	}
	json.NewEncoder(f).Encode(token)
}

func populateEvents(srv *calendar.Service, calendarID string, events []*calendar.Event) {
	for _, event := range events {
		e, err := srv.Events.Insert(calendarID, event).Do()
		if err != nil {
			log.Fatalf("Unable to create event. %v\n", err)
		}
		log.Printf("Event created: %s\n", e.HtmlLink)
	}
}

func listEvents(srv *calendar.Service, calendarID string) {
	t := time.Now().Format(time.RFC3339)
	events, err := srv.
		Events.
		List(calendarID).
		ShowDeleted(false).
		SingleEvents(true).
		TimeMin(t).
		MaxResults(10).
		OrderBy("startTime").
		Do()
	if err != nil {
		log.Fatalf("Unable to retrieve next ten of the user's events: %v", err)
	}
	log.Println("Upcoming events:")
	if len(events.Items) == 0 {
		log.Println("No upcoming events found.")
	} else {
		for _, item := range events.Items {
			date := item.Start.DateTime
			if date == "" {
				date = item.Start.Date
			}
			log.Printf("%v (%v) [%v]\n", item.Summary, date, item.Id)
		}
	}
}

func deleteAllEvents(srv *calendar.Service, calendarID string) {
	t := time.Now().Format(time.RFC3339)
	events, err := srv.
		Events.
		List(calendarID).
		ShowDeleted(false).
		SingleEvents(true).
		TimeMin(t).
		Do()

	if err != nil {
		log.Fatalf("Unable to retrieve next ten of the user's events: %v", err)
	}

	if len(events.Items) == 0 {
		log.Println("No upcoming events found.")
	} else {
		for _, item := range events.Items {
			success := srv.Events.Delete(calendarID, item.Id).Do()

			log.Printf("%+v", success)
		}
	}
}

func findCalendar(calendars []*calendar.CalendarListEntry, subString string) (*calendar.CalendarListEntry, error) {
	pattern := regexp.MustCompile(subString)

	for _, cal := range calendars {
		if pattern.MatchString(cal.Summary) {
			return cal, nil
		}
	}

	return nil, fmt.Errorf("No calendars match %s", subString)
}

func allCalendars(srv *calendar.Service) []*calendar.CalendarListEntry {
	calendars, err := srv.CalendarList.List().ShowDeleted(false).Do()
	if err != nil {
		log.Fatalf("Unable to retrieve Calendar list: %v", err)
	}

	return calendars.Items
}

func main() {
	b, err := ioutil.ReadFile("credentials.json")
	if err != nil {
		log.Fatalf("Unable to read client secret file: %v", err)
	}

	// If modifying these scopes, delete your previously saved token.json.
	config, err := google.ConfigFromJSON(b, calendar.CalendarScope)
	if err != nil {
		log.Fatalf("Unable to parse client secret file to config: %v", err)
	}
	client := getClient(config)

	srv, err := calendar.New(client)
	if err != nil {
		log.Fatalf("Unable to retrieve Calendar client: %v", err)
	}

	log.Println("Calendars:")
	calendars := allCalendars(srv)
	if len(calendars) == 0 {
		log.Println("No calendars found.")
	} else {
		for _, cal := range calendars {
			log.Printf("%v: %v\n", cal.Id, cal.Summary)
		}
	}

	// parse.Parse("input/AWS reInvent 2018.html")
	// events := parse.CalendarEvents("AWS reInvent 2018.html")

	// rand.Seed(time.Now().Unix())
	// sample := rand.Int() % len(events)

	// log.Printf("Total events: %d", len(events))
	// log.Printf("Random event: %+v", events[sample])

	calendar, err := findCalendar(calendars, ".*reInvent.*")
	if err != nil {
		log.Fatalf("No calendar found: %v", err)
	}

	// populateEvents(srv, calendarID, events)

	listEvents(srv, calendar.Id)
	// deleteAllEvents(srv, calendarID)
	// listEvents(srv, calendarID)
}
