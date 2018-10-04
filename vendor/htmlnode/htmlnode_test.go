package htmlnode_test

import (
	"htmlnode"
	"strings"
	"testing"

	"github.com/PuerkitoBio/goquery"
)

func TestText(t *testing.T) {
	cases := []struct {
		in   string
		want string
	}{
		{
			`<ul class="availableSessions sessionTimeList" style="display: block;">
			<div class="tooltip">Session enrollment has not yet begun.</div>
			Thursday, Nov 29, 1:00 PM  - 2:00 PM
			<span class="sessionRoom">
				– Mirage, Montego D, T1</span>
			</ul>
			`,
			"Thursday, Nov 29, 1:00 PM - 2:00 PM",
		},
		{
			`<ul class="availableSessions sessionTimeList" style="display: block;">
			Thursday, Nov 29, 1:00 PM - 2:00 PM
			</ul>
			`,
			"Thursday, Nov 29, 1:00 PM - 2:00 PM",
		},
	}

	for _, c := range cases {
		reader := strings.NewReader(c.in)
		doc, _ := goquery.NewDocumentFromReader(reader)
		httpNode := doc.Find("ul.availableSessions.sessionTimeList")
		got := htmlnode.Text(httpNode)

		if got != c.want {
			t.Errorf("Text(%v) == %-q, want %-q", c.in, got, c.want)
		}
	}
}
