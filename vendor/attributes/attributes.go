package attributes

import (
	"fmt"
)

// Attributes is an enum
type Attributes int

// ID and class
const (
	ID Attributes = iota
	Class
)

var (
	names = [...]string{
		"id",
		"class",
	}
)

func (key Attributes) String() string {
	// return the name of the attribute
	return names[key]
}

func New(attribute string) (Attributes, error) {
	for i, name := range names {
		if name == attribute {
			return Attributes(i), nil
		}
	}
	return Attributes(-1), fmt.Errorf("%s is not a valid attribute", attribute)
}
