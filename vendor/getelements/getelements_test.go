package getelements

import (
	"regexp"
	"strings"
	"testing"

	"golang.org/x/net/html"
)

type Want struct {
	data      string
	childData string
}

func TestByClass(t *testing.T) {
	cases := []struct {
		in    string
		class *regexp.Regexp
		want  Want
	}{
		{
			`<!DOCTYPE html>
<html>
<head><title>[Go] HTML table to reStructuredText list-table</title></head>
<body>
  <table>
    <tr><td class="foo">R1, C1</td><td>R1, C2</td></tr>
    <tr><td class="foo">R2, C1</td><td>R2, C2</td></tr>
  </table>
</body>
</html>`,
			regexp.MustCompile("^foo$"),
			Want{
				"td",
				"R1, C1",
			},
		},
	}

	for _, c := range cases {
		doc, _ := html.Parse(strings.NewReader(c.in))
		got := ByID(doc, c.id)

		if got.Data != c.want.data && got.FirstChild.Data != c.want.childData {
			t.Errorf("ByID(%q, %v) == %#v, \nwant %#v", c.in, c.id, got.Data, c.want.data)
		}
	}
}

func TestByID(t *testing.T) {
	cases := []struct {
		in   string
		id   *regexp.Regexp
		want Want
	}{
		{
			`<!DOCTYPE html>
<html>
<head><title>[Go] HTML table to reStructuredText list-table</title></head>
<body>
  <table>
    <tr><td id="foo">R1, C1</td><td>R1, C2</td></tr>
    <tr><td>R2, C1</td><td>R2, C2</td></tr>
  </table>
</body>
</html>`,
			regexp.MustCompile("^foo$"),
			Want{
				"td",
				"R1, C1",
			},
		},

		{
			`<!DOCTYPE html>
<html>
<head><title>[Go] HTML table to reStructuredText list-table</title></head>
<body>
  <table>
    <tr><td id="foo">R1, C1</td><td>R1, C2</td></tr>
    <tr><td>R2, C1</td><td>R2, C2</td></tr>
  </table>
</body>
</html>`,
			regexp.MustCompile("^foo2$"),
			Want{
				"",
				"",
			},
		},
	}

	for _, c := range cases {
		doc, _ := html.Parse(strings.NewReader(c.in))
		got := ByID(doc, c.id)

		if got.Data != c.want.data && got.FirstChild.Data != c.want.childData {
			t.Errorf("ByID(%q, %v) == %#v, \nwant %#v", c.in, c.id, got.Data, c.want.data)
		}
	}
}

// const indexHtml = `<!DOCTYPE html>
// <html>
// <head><title>[Go] HTML table to reStructuredText list-table</title></head>
// <body>
//   <table>
//     <tr><td id="foo">R1, C1</td><td>R1, C2</td></tr>
//     <tr><td>R2, C1</td><td>R2, C2</td></tr>
//   </table>
// </body>
// </html>`

// func TestTable2Rst(t *testing.T) {
// 	doc, err := html.Parse(strings.NewReader(indexHtml))
// 	if err != nil {
// 		panic("Fail to parse!")
// 	}
// 	validID := regexp.MustCompile("^foo$")
// 	r1 := GetElementById(doc, validID)
// 	if r1.Data != "td" || r1.FirstChild.Data != "R1, C1" {
// 		t.Error("wrong element whose id is foo")
// 	}

// 	r2 := getElementById(doc, "foo2")
// 	if r2 != nil {
// 		t.Error("foo2 should not exist!")
// 	}
// }
