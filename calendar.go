package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"regexp"
	"strings"
	"time"
	"util"

	"golang.org/x/net/context"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
	"google.golang.org/api/calendar/v3"
)

var (
	credentialsFile string
	matchCal        string
	eventCaption    string
	eventTime       time.Time
	eventTimeStr    string
	eventDuration   time.Duration
	showEvents      bool
	profileName     string
)

func tokenFileName() string {
	credentialsFileName := strings.Split(credentialsFile, ".")[0]
	var sb strings.Builder
	sb.WriteString(credentialsFileName)
	sb.WriteString("_token.json")

	return sb.String()
}

// Retrieve a token, saves the token, then returns the generated client.
func getClient(config *oauth2.Config) *http.Client {
	tokFileName := tokenFileName()
	tok, err := tokenFromFile(tokFileName)
	if err != nil {
		tok = getTokenFromWeb(config)
		saveToken(tokFileName, tok)
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

func newEvent(eventCaption string, eventTime time.Time, eventDuration time.Duration) *calendar.Event {
	eventTimeEnd := eventTime.Add(eventDuration)
	return &calendar.Event{
		Summary: eventCaption,
		Start: &calendar.EventDateTime{
			DateTime: eventTime.Format("2006-01-02T15:04:05-08:00"),
			TimeZone: "America/Los_Angeles",
		},
		End: &calendar.EventDateTime{
			DateTime: eventTimeEnd.Format("2006-01-02T15:04:05-08:00"),
			TimeZone: "America/Los_Angeles",
		},
	}
}

func createEvent(srv *calendar.Service, calendarID *string, event *calendar.Event) (string, error) {
	e, err := srv.Events.Insert(*calendarID, event).Do()
	if err != nil {
		return "", err
	}
	return e.HtmlLink, nil
}

func parseFlags() {
	const (
		credentialsFileUsage   = "pass -c=<credentialsFile> to read GCal credentials from"
		defaultCaption         = "Event caption placeholder"
		defaultCredentialsFile = "credentials.json"
		defaultDuration        = time.Duration(30 * time.Minute)
		defaultMatchCal        = ".*"
		defaultProfileName     = "default"
		defaultShowEvents      = false
		defaultTime            = "Time is required"
		eventDurationUsage     = "A duration string is a sequence of decimal numbers, each with optional fraction and a unit suffix, such as \"-1.5h\" or \"2h45m\". Valid time units are \"s\", \"m\", \"h\". "
		eventTimeUsage         = "Provide time in the format of Monday, Jan 02, 3:04 PM -0700 MST 2006"
		matchCalUsage          = "pass -mc=<.*partCalendarName.*> to choose a calendar, e.g. gcal "
		profileNameUsage       = "Provide the name of the profile to identify the account"
		showEventsUsage        = "Shows envents for a given calendar. defaults to false"
		usage                  = "specify one of the following commands: profile, list, create"
	)

	profileCommand := flag.NewFlagSet("profile", flag.ExitOnError)
	profileCommand.StringVar(&credentialsFile, "c", defaultCredentialsFile, credentialsFileUsage)
	profileCommand.StringVar(&profileName, "name", defaultProfileName, profileNameUsage)

	listCommand := flag.NewFlagSet("list", flag.ExitOnError)
	listCommand.BoolVar(&showEvents, "events", defaultShowEvents, showEventsUsage)
	listCommand.StringVar(&matchCal, "match", defaultMatchCal, matchCalUsage)

	createCommand := flag.NewFlagSet("create", flag.ExitOnError)
	createCommand.StringVar(&eventTimeStr, "time", defaultTime, eventTimeUsage)
	createCommand.DurationVar(&eventDuration, "duration", defaultDuration, eventDurationUsage)
	createCommand.StringVar(&eventCaption, "caption", defaultCaption, "Text message")

	flag.Parse()
	fmt.Printf("other args: %+v\n", flag.Args())
	if len(flag.Args()) == 0 {
		fmt.Println(usage)
		os.Exit(2)
	}

	for i, command := range flag.Args() {
		switch command {
		case "profile":
			fmt.Printf("profileCommand flag args[%d:]: %+v\n", i+1, flag.Args()[i+1:])
			profileCommand.Parse(flag.Args()[i+1:])
		case "list":
			fmt.Printf("listCommand flag args[%d:]: %+v\n", i+1, flag.Args()[i+1:])
			listCommand.Parse(flag.Args()[i+1:])
		case "create":
			createCommand.Parse(os.Args[i:])
		}
	}
}

func main() {
	parseFlags()

	b, err := ioutil.ReadFile(credentialsFile)
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

	calendars := allCalendars(srv)
	if len(calendars) == 0 {
		log.Println("No calendars found.")
		os.Exit(2)
	}

	for _, command := range flag.Args() {
		switch command {
		case "profile":
			util.CreateDirIfNotExist(profileName)
		case "list":
			log.Println("Calendars:")
			for _, cal := range calendars {
				log.Printf("%v: %v\n", cal.Id, cal.Summary)
				if showEvents {
					listEvents(srv, cal.Id)
				}
			}
		case "create":
			calendar, err := findCalendar(calendars, matchCal)
			if err != nil {
				log.Fatalf("No calendar found: %v", err)
			} else {
				log.Printf("Found calendar: %q", calendar.Summary)
			}

			eventTime, err := time.Parse(util.TimeLayout, eventTimeStr)
			util.CheckErr(err)
			event := newEvent(eventCaption, eventTime, eventDuration)
			htmLink, err := createEvent(srv, &calendar.Id, event)
			util.CheckErr(err)

			log.Printf("Event created: %q", htmLink)
		}
	}

	// parse.Parse("input/AWS reInvent 2018.html")
	// events := parse.CalendarEvents("AWS reInvent 2018.html")

	// rand.Seed(time.Now().Unix())
	// sample := rand.Int() % len(events)

	// log.Printf("Total events: %d", len(events))
	// log.Printf("Random event: %+v", events[sample])
	// ".*reInvent.*"

	// createEvent(calendar.Id, time, title)

	// populateEvents(srv, calendarID, events)

	// deleteAllEvents(srv, calendarID)
	// listEvents(srv, calendarID)
}
