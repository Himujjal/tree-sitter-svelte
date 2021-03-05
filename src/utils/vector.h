#ifndef VECTOR_H
#define VECTOR_H

#include "allocator.h"
#include "hashmap.h"

#include <stdlib.h>
#include <string.h>

/* #define GROWTH_FACTOR 1.5 */
#define DEFAULT_COUNT_OF_ELEMENTS 8
#define MINIMUM_COUNT_OF_ELEMENTS 2

// ----------------------------------------------------------------------------

// vc_vector structure
typedef struct vc_vector vc_vector;
typedef void(vc_vector_deleter)(void *, za_Allocator *);

struct vc_vector {
  size_t count;
  size_t element_size;
  size_t reserved_size;
  char *data;
  vc_vector_deleter *deleter;
  za_Allocator *A;
};

void printTagVec(Tag *tag) {
  if (tag == NULL)
    printf("null,");
  else
    printf("{%d,%s},", tag->type, tag->custom_tag_name.buf);
}

void printVector(vc_vector *v) {
  printf("{count:%ld,ele_size:%ld,reserved_size:%ld,data:[", v->count,
         v->element_size, v->reserved_size);
  for (size_t i = 0; i < v->count; i++)
    printTagVec((Tag *)(v->data + i));
  printf("]}\n");
}

// ----------------------------------------------------------------------------
// Control
// ----------------------------------------------------------------------------

// Constructs an empty vector with an reserver size for count_elements.
vc_vector *vc_vector_create(za_Allocator *A, size_t count_elements,
                            size_t size_of_element, vc_vector_deleter *deleter);

// Constructs a copy of an existing vector.
vc_vector *vc_vector_create_copy(const vc_vector *vector);

// Releases the vector.
void vc_vector_release(vc_vector *vector);

// Compares vector content
bool vc_vector_is_equals(vc_vector *vector1, vc_vector *vector2);

// Returns constant value of the vector growth factor.
float vc_vector_get_growth_factor();

// Returns constant value of the vector default count of elements.
size_t vc_vector_get_default_count_of_elements();

// Returns constant value of the vector struct size.
size_t vc_vector_struct_size();

// ----------------------------------------------------------------------------
// Element access
// ----------------------------------------------------------------------------

// Returns the item at index position in the vector.
void *vc_vector_at(vc_vector *vector, size_t index);

// Returns the first item in the vector.
void *vc_vector_front(vc_vector *vector);

// Returns the last item in the vector.
void *vc_vector_back(vc_vector *vector);

// Returns a pointer to the data stored in the vector. The pointer can be used
// to access and modify the items in the vector.
void *vc_vector_data(vc_vector *vector);

// ----------------------------------------------------------------------------
// Iterators
// ----------------------------------------------------------------------------

// Returns a pointer to the first item in the vector.
void *vc_vector_begin(vc_vector *vector);

// Returns a pointer to the imaginary item after the last item in the vector.
void *vc_vector_end(vc_vector *vector);

// Returns a pointer to the next element of vector after 'i'.
void *vc_vector_next(vc_vector *vector, void *i);

// ----------------------------------------------------------------------------
// Capacity
// ----------------------------------------------------------------------------

// Returns true if the vector is empty; otherwise returns false.
bool vc_vector_empty(vc_vector *vector);

// Returns the number of elements in the vector.
size_t vc_vector_count(const vc_vector *vector);

// Returns the size (in bytes) of occurrences of value in the vector.
size_t vc_vector_size(const vc_vector *vector);

// Returns the maximum number of elements that the vector can hold.
size_t vc_vector_max_count(const vc_vector *vector);

// Returns the maximum size (in bytes) that the vector can hold.
size_t vc_vector_max_size(const vc_vector *vector);

// Resizes the container so that it contains n elements.
bool vc_vector_reserve_count(vc_vector *vector, size_t new_count);

// Resizes the container so that it contains new_size / element_size elements.
bool vc_vector_reserve_size(vc_vector *vector, size_t new_size);

// ----------------------------------------------------------------------------
// Modifiers
// ----------------------------------------------------------------------------

// Removes all elements from the vector (without reallocation).
void vc_vector_clear(vc_vector *vector);

// The container is extended by inserting a new element at position.
bool vc_vector_insert(vc_vector *vector, size_t index, const void *value);

// Removes from the vector a single element by 'index'
bool vc_vector_erase(vc_vector *vector, size_t index);

// Removes from the vector a range of elements '[first_index, last_index)'.
bool vc_vector_erase_range(vc_vector *vector, size_t first_index,
                           size_t last_index);

// Inserts multiple values at the end of the vector.
bool vc_vector_append(vc_vector *vector, const void *values, size_t count);

// Inserts value at the end of the vector.
bool vc_vector_push_back(vc_vector *vector, const void *value);

// Removes the last item in the vector.
bool vc_vector_pop_back(vc_vector *vector);

// Replace value by index in the vector.
bool vc_vector_replace(vc_vector *vector, size_t index, const void *value);

// Replace multiple values by index in the vector.
bool vc_vector_replace_multiple(vc_vector *vector, size_t index,
                                const void *values, size_t count);

// ----------------------------------------------------------------------------

// Auxiliary methods

bool vc_vector_realloc(vc_vector *vector, size_t new_count) {
  const size_t new_size = new_count * vector->element_size;
  char *new_data = (char *)za_ReAlloc(vector->A, vector->data, new_size);
  if (!new_data) {
    return false;
  }

  vector->reserved_size = new_size;
  vector->data = new_data;
  return true;
}

// [first_index, last_index)
void vc_vector_call_deleter(vc_vector *vector, size_t first_index,
                            size_t last_index) {
  for (size_t i = first_index; i < last_index; ++i) {
    vector->deleter(vc_vector_at(vector, i), vector->A);
  }
}

void vc_vector_call_deleter_all(vc_vector *vector) {
  vc_vector_call_deleter(vector, 0, vc_vector_count(vector));
}

// ----------------------------------------------------------------------------

// Control

vc_vector *vc_vector_create(za_Allocator *A, size_t count_elements,
                            size_t size_of_element,
                            vc_vector_deleter *deleter) {
  vc_vector *v = (vc_vector *)za_Alloc(A, sizeof(vc_vector));

  if (count_elements < MINIMUM_COUNT_OF_ELEMENTS) {
    count_elements = DEFAULT_COUNT_OF_ELEMENTS;
  }

  if (v != NULL) {
    v->data = za_Alloc(A, size_of_element * count_elements);
    v->count = 0;
    v->element_size = size_of_element;
    v->deleter = deleter;
    v->A = A;
    v->reserved_size = count_elements * size_of_element;

    /* if (size_of_element < 1 && !vc_vector_realloc(v, count_elements)) { */
    /*   za_Free(A, v); */
    /*   v = NULL; */
    /* } */
  }

  return v;
}

vc_vector *vc_vector_create_copy(const vc_vector *vector) {
  vc_vector *new_vector =
      vc_vector_create(vector->A, vector->reserved_size / vector->count,
                       vector->element_size, vector->deleter);
  if (!new_vector) {
    return new_vector;
  }

  if (memcpy(vector->data, new_vector->data,
             new_vector->element_size * vector->count) == NULL) {
    vc_vector_release(new_vector);
    new_vector = NULL;
    return new_vector;
  }

  new_vector->count = vector->count;
  return new_vector;
}

void vc_vector_release(vc_vector *vector) {
  /* if (vector->deleter != NULL) { */
  /*   vc_vector_call_deleter_all(vector); */
  /* } */

  /* if (vector->reserved_size != 0) { */
  /*   /1* free(vector->data); *1/ */
  /* } */

  /* if (vector != NULL) */
  /* free(vector); */
}

bool vc_vector_is_equals(vc_vector *vector1, vc_vector *vector2) {
  const size_t size_vector1 = vc_vector_size(vector1);
  if (size_vector1 != vc_vector_size(vector2)) {
    return false;
  }

  return memcmp(vector1->data, vector2->data, size_vector1) == 0;
}

float vc_vector_get_growth_factor() { return 1.5; }

size_t vc_vector_get_default_count_of_elements() {
  return DEFAULT_COUNT_OF_ELEMENTS;
}

size_t vc_vector_struct_size() { return sizeof(vc_vector); }

// ----------------------------------------------------------------------------

// Element access

void *vc_vector_at(vc_vector *vector, size_t index) {
  return vector->data + index * vector->element_size;
}

void *vc_vector_front(vc_vector *vector) { return vector->data; }

void *vc_vector_back(vc_vector *vector) {
  return vector->data + (vector->count - 1) * vector->element_size;
}

void *vc_vector_data(vc_vector *vector) { return vector->data; }

// ----------------------------------------------------------------------------

// Iterators

void *vc_vector_begin(vc_vector *vector) { return vector->data; }

void *vc_vector_end(vc_vector *vector) {
  return vector->data + vector->element_size * vector->count;
}

void *vc_vector_next(vc_vector *vector, void *i) {
  return (char *)i + vector->element_size;
}

// ----------------------------------------------------------------------------

// Capacity

bool vc_vector_empty(vc_vector *vector) { return vector->count == 0; }

size_t vc_vector_count(const vc_vector *vector) { return vector->count; }

size_t vc_vector_size(const vc_vector *vector) {
  return vector->count * vector->element_size;
}

size_t vc_vector_max_count(const vc_vector *vector) {
  return vector->reserved_size / vector->element_size;
}

size_t vc_vector_max_size(const vc_vector *vector) {
  return vector->reserved_size;
}

bool vc_vector_reserve_count(vc_vector *vector, size_t new_count) {
  if (new_count < vector->count) {
    return false;
  }

  size_t new_size = vector->element_size * new_count;
  if (new_size == vector->reserved_size) {
    return true;
  }

  return vc_vector_realloc(vector, new_count);
}

bool vc_vector_reserve_size(vc_vector *vector, size_t new_size) {
  return vc_vector_reserve_count(vector, new_size / vector->element_size);
}

// ----------------------------------------------------------------------------

// Modifiers

void vc_vector_clear(vc_vector *vector) {
  if (vector->deleter != NULL) {
    vc_vector_call_deleter_all(vector);
  }

  vector->count = 0;
}

bool vc_vector_insert(vc_vector *vector, size_t index, const void *value) {
  if (vc_vector_max_count(vector) < vector->count + 1) {
    if (!vc_vector_realloc(vector, vc_vector_max_count(vector) *
                                       vc_vector_get_growth_factor())) {
      return false;
    }
  }

  if (!memmove(vc_vector_at(vector, index + 1), vc_vector_at(vector, index),
               vector->element_size * (vector->count - index))) {

    return false;
  }

  if (memcpy(vc_vector_at(vector, index), value, vector->element_size) ==
      NULL) {
    return false;
  }

  ++vector->count;
  return true;
}

bool vc_vector_erase(vc_vector *vector, size_t index) {
  if (vector->deleter != NULL) {
    vector->deleter(vc_vector_at(vector, index), vector->A);
  }

  if (!memmove(vc_vector_at(vector, index), vc_vector_at(vector, index + 1),
               vector->element_size * (vector->count - index))) {
    return false;
  }

  vector->count--;
  return true;
}

bool vc_vector_erase_range(vc_vector *vector, size_t first_index,
                           size_t last_index) {
  if (vector->deleter != NULL) {
    vc_vector_call_deleter(vector, first_index, last_index);
  }

  if (!memmove(vc_vector_at(vector, first_index),
               vc_vector_at(vector, last_index),
               vector->element_size * (vector->count - last_index))) {
    return false;
  }

  vector->count -= last_index - first_index;
  return true;
}

bool vc_vector_append(vc_vector *vector, const void *values, size_t count) {
  /* #define GROWTH_FACTOR 1.5 */
  const size_t count_new = count + vc_vector_count(vector);

  if (vc_vector_max_count(vector) < count_new) {
    float GROWTH_FACTOR = vc_vector_get_growth_factor();
    size_t max_count_to_reserved = vc_vector_max_count(vector) * GROWTH_FACTOR;
    while (count_new > max_count_to_reserved) {
      max_count_to_reserved *= GROWTH_FACTOR;
    }

    if (!vc_vector_realloc(vector, max_count_to_reserved)) {
      return false;
    }
  }

  if (memcpy(vector->data + vector->count * vector->element_size, values,
             vector->element_size * count) == NULL) {
    return false;
  }

  vector->count = count_new;
  return true;
}

bool vc_vector_push_back(vc_vector *vector, const void *value) {
  if (!vc_vector_append(vector, value, 1)) {
    return false;
  }
  return true;
}

bool vc_vector_pop_back(vc_vector *vector) {
  if (vector->deleter != NULL) {
    vector->deleter(vc_vector_back(vector), vector->A);
  }

  vector->count--;
  return true;
}

bool vc_vector_replace(vc_vector *vector, size_t index, const void *value) {
  if (vector->deleter != NULL) {
    vector->deleter(vc_vector_at(vector, index), vector->A);
  }

  return memcpy(vc_vector_at(vector, index), value, vector->element_size) !=
         NULL;
}

bool vc_vector_replace_multiple(vc_vector *vector, size_t index,
                                const void *values, size_t count) {
  if (vector->deleter != NULL) {
    vc_vector_call_deleter(vector, index, index + count);
  }

  return memcpy(vc_vector_at(vector, index), values,
                vector->element_size * count) != NULL;
}

bool vc_vector_resize(vc_vector *vector, size_t new_count, void *defaultValue) {
  // trim or append elements, provide strong guarantee
  const size_t old_count = vector->count;

  if (new_count == old_count)
    return true;

  if (new_count < old_count) { // trim
    for (int i = new_count; i < old_count; i++)
      vector->deleter(vc_vector_at(vector, i), vector->A);
    return true;
  }

  // new_count > old_count
  const size_t old_capacity = vector->reserved_size;
  if (new_count > old_capacity) { // reallocate
    vc_vector_realloc(vector, new_count);
  }

  for (int i = old_count; i < new_count; i++)
    memcpy(vector->data + i, defaultValue, vector->element_size);

  vector->count = new_count;

  return true;
}

#endif
