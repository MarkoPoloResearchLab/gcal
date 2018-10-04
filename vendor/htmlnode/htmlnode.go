package htmlnode

import (
	"regexp"

	"github.com/PuerkitoBio/goquery"
)

var (
	nonEmptyString    = regexp.MustCompile(`\S+`)
	spaces            = regexp.MustCompile(`[\t\n\v\f\r]`)
	doubleWhiteSpaces = regexp.MustCompile(`\ {2,}`)
)

// Text return the text of the root element
func Text(s *goquery.Selection) (text string) {
	s.Contents().Each(func(i int, s *goquery.Selection) {
		t, found := extractText(s)
		if found && nonEmptyString.MatchString(t) {
			noSpaces := spaces.ReplaceAllLiteralString(t, "")
			text = doubleWhiteSpaces.ReplaceAllLiteralString(noSpaces, " ")
		}
	})
	return text
}

func extractText(s *goquery.Selection) (string, bool) {
	if goquery.NodeName(s) == "#text" {
		return s.Text(), true
	}

	return "", false
}
