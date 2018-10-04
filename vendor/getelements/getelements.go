package getelements

import (
	"attributes"
	"regexp"

	"golang.org/x/net/html"
)

func getAttribute(n *html.Node, key attributes.Attributes) (string, bool) {
	for _, attr := range n.Attr {
		if attr.Key == key.String() {
			return attr.Val, true
		}
	}
	return "", false
}

func checkAttribute(n *html.Node, key attributes.Attributes, val *regexp.Regexp) bool {
	if n.Type == html.ElementNode {
		s, ok := getAttribute(n, key)
		if ok && val.MatchString(s) {
			return true
		}
	}
	return false
}

func checkID(n *html.Node, id *regexp.Regexp) bool {
	if n.Type == html.ElementNode {
		s, ok := getAttribute(n, "id")
		if ok && id.MatchString(s) {
			return true
		}
	}
	return false
}

func checkClass(n *html.Node, class *regexp.Regexp) bool {
	if n.Type == html.ElementNode {
		s, ok := getAttribute(n, "class")

		if ok && class.MatchString(s) {
			return true
		}
	}
	return false
}

func traverse() {

}

func traverse(n *html.Node, id *regexp.Regexp) *html.Node {
	if checkID(n, id) {
		return n
	}

	for c := n.FirstChild; c != nil; c = c.NextSibling {
		result := traverse(c, id)
		if result != nil {
			return result
		}
	}

	return nil
}

// ByID returns an element by ID
func ByID(n *html.Node, id *regexp.Regexp) *html.Node {
	if checkAttribute(n, id, id) {
		return n
	}

	for c := n.FirstChild; c != nil; c = c.NextSibling {
		result := traverse(c, id)
		if result != nil {
			return result
		}
	}

	return nil
}

// ByClass returns an element by class
func ByClass(n *html.Node, class *regexp.Regexp) *html.Node {
	return traverse(n, class)
}
