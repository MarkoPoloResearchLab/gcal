package util

import (
	"testing"
	"time"
)

func lasVegas() *time.Location {
	lasVegas, err := time.LoadLocation("America/Los_Angeles")
	if err != nil {
		panic(err)
	}
	return lasVegas
}

func TestParseTime(t *testing.T) {
	cases := []struct {
		in   string
		want time.Time
	}{
		{
			"Thursday, Nov 29, 1:00 PM -0800 PST 2018",
			time.Date(2018, 11, 29, 13, 0, 0, 0, lasVegas()),
		},
	}

	for _, c := range cases {
		got := ParseTime(c.in)

		if !c.want.Equal(got) {
			t.Errorf("ParseTime(%q) == %q, want %q", c.in, got, c.want)
		}
	}
}

func TestParseTimePanic(t *testing.T) {
	defer func() {
		if r := recover(); r == nil {
			t.Errorf("The code did not panic")
		}
	}()

	ParseTime("nonsense")
}

func TestParseEvent(t *testing.T) {
	cases := []struct {
		in   string
		want Event
	}{
		{
			"Monday, Nov 26, 10:45 AM - 11:45 AM",
			Event{
				time.Date(2018, 11, 26, 10, 45, 0, 0, lasVegas()),
				time.Date(2018, 11, 26, 11, 45, 0, 0, lasVegas()),
			},
		},
	}

	for _, c := range cases {
		got := ParseEvent(c.in)

		if !c.want.Start.Equal(got.Start) {
			t.Errorf("ParseEvent(%q) == %q, want %q", c.in, got.Start, c.want.Start)
		}
		if !c.want.End.Equal(got.End) {
			t.Errorf("ParseEvent(%q) == %q, want %q", c.in, got.End, c.want.End)
		}
	}
}

func TestValidEvent(t *testing.T) {
	cases := []struct {
		in   string
		want bool
	}{
		{
			"Monday, Nov 26, 10:45 AM - 11:45 AM",
			true,
		},
		{
			"Monday, November 26, 10:45 AM - 11:45 AM",
			false,
		},
		{
			"Thursday, Nov 29, 2:30 PM - 3:30 PM",
			true,
		},
	}

	for _, c := range cases {
		got := validEvent(c.in)

		if c.want != got {
			t.Errorf("validEvent(%q) == %T, want %T", c.in, got, c.want)
		}
	}
}

func TestSplitEvent(t *testing.T) {
	cases := []struct {
		in   string
		want []string
	}{
		{
			"Monday, Nov 26, 10:45 AM - 11:45 AM",
			[]string{"Monday, Nov 26, 10:45 AM", "11:45 AM"},
		},
	}

	for _, c := range cases {
		got0, got1 := splitEvent(c.in)

		if c.want[0] != got0 {
			t.Errorf("SplitEvent(%q) == %q, want %q", c.in, got0, c.want[0])
		}

		if c.want[1] != got1 {
			t.Errorf("SplitEvent(%q) == %q, want %q", c.in, got1, c.want[1])
		}
	}
}

func TestParseEventPanic(t *testing.T) {
	defer func() {
		if r := recover(); r == nil {
			t.Errorf("The code did not panic")
		}
	}()

	ParseEvent("nonsense")
}

func TestFormEndTime(t *testing.T) {
	cases := []struct {
		in   []string
		want string
	}{
		{
			[]string{"Monday, Nov 26, 10:45 AM", "11:45 AM"},
			"Monday, Nov 26, 11:45 AM",
		},
	}

	for _, c := range cases {
		got := formEndTime(c.in[0], c.in[1])

		if c.want != got {
			t.Errorf("formEndTime(%q, %q) == %q, want %q", c.in[0], c.in[1], got, c.want)
		}
	}
}
