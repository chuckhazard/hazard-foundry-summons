# Customization
Sortable headers can be defined for the creature list, and each row can be customized to show additional index fields.

## Headers
Default headers and sorting are built in for the DND5E, PF2E, and default formats. Additional column data can be passed when `openMenu()` is called to sort on and format additional indexed fields.

The **Image** column is always displayed and non-sortable. Column definitions should start with the second column.

![Alt text](images/headers_5e_custom_format.jpg?raw=true "Spiders sorted by CR with fraction display")

![Alt text](images/headers_pf2e.jpg?raw=true "PF2E creatures sorted by level")

## Custom Fields
Additional indexed fields can be added to the column display, or custom formatting can be provided for existing fields. This data is provided by passing an object containing `columns[]` data.

```
let columns = [col1Definition, col2Definition, ...]
foundrySummons.openMenu({columns})
```

## Column Definition
A column definition specifies the column name, width, valueFn() method for display/sort and a compareFn() for sorting. 

```
let columns = [
  {
    name: "Name",
    value: (creature) => creature.name,
    compareFn: (a,b) => a-b
  },
  ...
]
```
**Name**

Required. This field is displayed as the column header.

**value**

Required. This function takes the creature as a parameter and should return the text to be displayed in the row.

**compareFn**

Optional. This function takes two creatures as parameters and should return <0 if `a` should be sorted first, >0 if `b` should, or 0 if they are equivalent.

If no compareFn is provided a default function will be used which attempts to apply the best fit sort based on the data.

### Creating Column Definitions

A convenience method is provided for creating column definitions. The following example provides custom formatting for the CR display. The sort for CR is also customized to ensure sort is provided on the underlying value rather than the display value.

**Note**

Fields used must be ***indexed*** via the additional index fields in Foundry Summons configuration.

```
let columns = [
 foundrySummons.columnDefinition('Name', (item) => item.name),
 foundrySummons.columnDefinition('HP',
    (item) => item.system?.attributes?.hp?.value),
 foundrySummons.columnDefinition(
    'CR',
    (creature) => {
        if (creature.system.detail.cr == 0.125) return "&frac18;"
        if (creature.system.detail.cr == 0.25) return "&frac14;"
        if (creature.system.detail.cr == 0.5) return "&frac12;"
        return creature.system.detail.cr
    },
    (a, b) => a.system.details.cr - b.system.details.cr),
 ];

foundrySummons.openMenu({ columns)
```

![Alt text](images/headers_5e_custom_format.jpg?raw=true "Spiders sorted by CR")