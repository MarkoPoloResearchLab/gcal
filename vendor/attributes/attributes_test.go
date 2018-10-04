package attributes_test

import (
	"attributes"
	"testing"
)

func TestString(t *testing.T) {
	cases := []struct {
		in   attributes.Attributes
		want string
	}{
		{attributes.ID, "id"},
		{attributes.Class, "class"},
	}

	for _, c := range cases {
		got := c.in.String()
		if got != c.want {
			t.Errorf("String(%v) == %v, want %v", c.in, got, c.want)
		}
	}
}
